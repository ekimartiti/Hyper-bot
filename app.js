const express = require('express');
const fs = require('fs')
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const app = express();
const User = require('./models/User');
const Email = require('./models/email');
const bcrypt = require('bcryptjs');
let config = JSON.parse(fs.readFileSync('config.json', 'utf-8'));
const mongoURI = config.mongoKey

// Connect to MongoDB
//mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  //  .then(() => console.log('Connected to MongoDB'))
 //   .catch(err => console.error('Failed to connect to MongoDB', err));

module.exports = function startweb(){
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Initialize session
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
    if (req.session.isAuthenticated) {
        next();
    } else {
        res.redirect('/login');
    }
}

// Route for login
app.get('/login', (req, res) => {
    res.render('login'); // Create a login.ejs file in your views folder
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    const user = await User.findOne({ username });

    if (!user) {
        return res.render('login', { error: 'Username salah' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.render('login', { error: 'Password salah' });
    }

    req.session.isAuthenticated = true;
    req.session.username = user.username;
    res.redirect('/');
});

// Route for logout
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/');
        }
        res.redirect('/login');
    });
});

// Protected routes
app.get('/', isAuthenticated, async (req, res) => {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const emails = await Email.find({ createdAt: { $gte: startOfMonth } }).sort({ createdAt: -1 });
    res.render('index', { emails, searchQuery: '' });
});

app.get('/add', isAuthenticated, (req, res) => {
    res.render('addEmail');
});

app.post('/add', isAuthenticated, async (req, res) => {
    const { emails, password, createdAt, activeStatus, soldStatus, ekStatus, ytbTrial, status } = req.body;
    const emailList = emails.split('\n').map(email => email.trim()).filter(email => email !== '');

    const addedEmails = [];
    const skippedEmails = [];

    for (const email of emailList) {
        const existing = await Email.findOne({ email });

        if (existing) {
            skippedEmails.push(email);
            continue; // Lewatkan jika sudah ada
        }

        const newEmail = new Email({
            email,
            password,
            createdAt,
            activeStatus,
            soldStatus,
            ekStatus,
            ytbTrial,
            status
        });

        await newEmail.save();
        addedEmails.push(email);
    }

    res.render('addResult', { addedEmails, skippedEmails });
});

app.get('/edit/:email', isAuthenticated, async (req, res) => {
    const email = await Email.findOne({ email: req.params.email });
    res.render('editEmail', { email });
});

app.post('/edit/:email', isAuthenticated, async (req, res) => {
    const { activeStatus, soldStatus, ekStatus, ytbTrial, status } = req.body;
    await Email.findOneAndUpdate({ email: req.params.email }, { activeStatus, soldStatus, ekStatus, ytbTrial, status});
    res.redirect('/');
});

app.post('/delete/:email', isAuthenticated, async (req, res) => {
    await Email.findOneAndDelete({ email: req.params.email });
    res.redirect('/');
});

app.get('/search', isAuthenticated, async (req, res) => {
    const { q } = req.query;
    const emails = await Email.find({ email: new RegExp(q, 'i') });
    res.render('index', { emails, searchQuery: q });
});

app.get('/stats', isAuthenticated, async (req, res) => {
    const emails = await Email.find();

    const totalEmails = emails.length;
    const activeEmails = emails.filter(e => e.activeStatus === 'active').length;
    const inactiveEmails = emails.filter(e => e.activeStatus === 'inactive').length;
    const soldEmails = emails.filter(e => e.soldStatus === 'sold').length;
    const notSoldEmails = emails.filter(e => e.soldStatus === 'not sold' && e.activeStatus === 'active').length;
    const gmailBekas = emails.filter(e => e.status === 'bekas' && e.soldStatus === 'not sold').length;
    const gmailFresh = emails.filter(e => e.status === 'fresh' && e.soldStatus === 'not sold' && e.ytbTrial === 'off' ).length;

    const years = emails.reduce((acc, { createdAt }) => {
        const year = new Date(createdAt).getFullYear();
        acc[year] = (acc[year] || 0) + 1;
        return acc;
    }, {});

    // === Statistik tambahan ===
    const ytbOn = emails.filter(e => e.ytbTrial === 'on').length;
    const ytbOnNotSold = emails.filter(e => e.ytbTrial === 'on' && e.soldStatus === 'not sold').length;
    

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const gmailThisMonth = emails.filter(e =>
        e.email.includes('@gmail.com') &&
        new Date(e.createdAt) >= firstDayOfMonth
    ).length;

    const pakeYtb = emails.filter(e => e.soldStatus === 'pake ytb').length;
    const sdYtb = emails.filter(e => e.soldStatus === 'sold ytb').length;

    // === Grafik per tanggal ===
    const emailStats = {
        dates: [],
        counts: []
    };

    const emailCountByDate = emails.reduce((acc, email) => {
        const date = new Date(email.createdAt).toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
    }, {});

    for (const [date, count] of Object.entries(emailCountByDate)) {
        emailStats.dates.push(date);
        emailStats.counts.push(count);
    }

    res.render('stats', {
        totalEmails,
        activeEmails,
        inactiveEmails,
        soldEmails,
        notSoldEmails,
        years,
        emailStats,
        ytbOn,
        ytbOnNotSold,
        gmailThisMonth,
        pakeYtb,
        sdYtb,
        gmailBekas,
        gmailFresh,
        searchQuery: ''
    });
});

app.get('/stats/:year', isAuthenticated, async (req, res) => {
    const year = parseInt(req.params.year);
    const emails = await Email.find();
    const filteredEmails = emails.filter(e => new Date(e.createdAt).getFullYear() === year);
    const months = filteredEmails.reduce((acc, { createdAt }) => {
        const month = new Date(createdAt).getMonth() + 1;
        acc[month] = (acc[month] || 0) + 1;
        return acc;
    }, {});

    res.render('yearStats', { year, months });
});

app.get('/stats/:year/:month', isAuthenticated, async (req, res) => {
    const year = parseInt(req.params.year);
    const month = parseInt(req.params.month);
    const emails = await Email.find({
        createdAt: {
            $gte: new Date(year, month - 1, 1),
            $lt: new Date(year, month, 1)
        }
    }).sort({ createdAt: -1 }); // Sort in descending order by createdAt

    res.render('monthStats', { year, month, emails });
});

app.get('/status/:status', isAuthenticated, async (req, res) => {
    const { status } = req.params;
    let query = {};

    // Cek apakah ini status spesial
    if (status === 'ytbtrial-on') {
        query = { ytbTrial: 'on', activeStatus: 'active', soldStatus: "not sold" };
    } else if(status === 'statusFresh'){
              query = { status: 'fresh', activeStatus: 'active', soldStatus: "not sold",
             ytbTrial: 'off' };
    } else if(status === 'statusBekas'){
              query = { status: 'bekas', activeStatus: 'active', soldStatus: "not sold" };
      
    }else{
        query = { soldStatus: status, activeStatus: 'active' };
    }

    const emails = await Email.find(query).sort({ createdAt: -1 });
    res.render('index', { emails, searchQuery: '' });
});

app.get('/inactive', isAuthenticated, async (req, res) => {
    const emails = await Email.find({ activeStatus: 'inactive' }).sort({ createdAt: -1 });
    res.render('index', { emails, searchQuery: '' });
});

app.post('/sold/:email', isAuthenticated, async (req, res) => {
    const { email } = req.params;
    try {
        await Email.findOneAndUpdate({ email }, { soldStatus: 'sold' });
        res.redirect('/');
    } catch (err) {
        console.error('Error updating sold status:', err);
        res.status(500).send('Error updating sold status');
    }
});

// Menampilkan halaman edit status
app.get('/edit-status/:email', async (req, res) => {
    const email = await Email.findOne({ email: req.params.email });
    if (!email) return res.status(404).send('Email not found');
    res.render('edit-status', { email });
});

// Menangani update status
app.post('/edit-status/:email', async (req, res) => {
    const { soldStatus } = req.body;
    await Email.updateOne({ email: req.params.email }, { soldStatus });
    res.redirect('/');
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
}

