import express from "express";
import session from "express-session";
import bodyParser from "body-parser";
import ejs from "ejs";
import mysql from "mysql";
import dotenv from 'dotenv';
dotenv.config();


const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.use(bodyParser.json());
app.use(express.json());


// middlewares
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

app.use(session({
    secret: process.env.SESSION_SECRET, // Replace with a strong secret key
    resave: false,
    saveUninitialized: true,
    cookie: { 
        secure: false,
        maxAge: 2 * 24 * 60 * 60 * 1000
    } // Set secure to true if using HTTPS
    
}));


// db connection
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DBNAME
});

pool.getConnection(function(err) {
    if(err) throw err;
    else console.log("Successfully connected to database");
})

app.listen(4899, () => {
    console.log("Server running on port 4899");
});

let loggedInUsername = null;
let loggedInDusername = null;


app.get("/logout", (req, res) => {
    // Destroy the session
    req.session.destroy((err) => {
        if (err) {
            console.error("Failed to destroy session:", err);
            return res.status(500).send("Failed to log out.");
        }
        // Redirect to the main route
        res.redirect("/");
    });
});


app.get("/", (req, res) => {
    res.render("index");
});

app.post("/signin", (req, res) => {
    const susername = req.body.username;
    const spassword = req.body.password;

    const dusername = req.body.dusername;
    const dpassword = req.body.dpassword;

    if(susername && spassword){
        pool.query('SELECT * FROM reg_students WHERE userid=? and password=?', [susername, spassword], (err, results, fields) => {
            console.log(results);
            if(err){
                return res.status(500).json({ message: 'Database error', error: err });
            }
            if (results.length > 0 && results[0].password === spassword) {
                req.session.user = {
                    username: susername,
                    type: 'student'
                };
                console.log(req.session.secret);
                return res.redirect("/home");
            } 
            else {
                return res.json({ message: 'Incorrect credentials, please try again.' });
            }
        })
    }
    else if(dusername && dpassword){
        pool.query('SELECT * FROM departments WHERE dusername=? and dpassword=?', [dusername, dpassword], (err, results1, fields) => {
            if(err){
                console.log(err);
                return res.status(500).json({ message: 'Database error', error: err });
            }
            if (results1.length > 0 && results1[0].dpassword === dpassword) {
                req.session.user = {
                    username: dusername,
                    type: 'department'
                };
                return res.redirect("/dhome");
            } 
            else {
                return res.json({ message: 'Incorrect credentials, please try again.' });
            }
        })
    }
});

app.get("/signup", (req, res) => {
    res.render("signup");
});


app.post("/signup", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const passwordConfirmation = req.body.passwordConfirmation;

    if(username && password && passwordConfirmation){
        pool.query('SELECT * FROM reg_students where userid=?', [username], (err, results, fields) => {
            if(results.length === 0){ // unregistered student
                pool.query('SELECT * FROM nitap_students where userid=?', [username], (err, results1) => {
                    if(results1.length > 0){
                        if(password !== passwordConfirmation){
                            console.log("Passwords donot match");
                            res.render("signup");
                        }
                        else{
                            pool.query('INSERT INTO reg_students(userid, password) values (?, ?)', [username, password], (err, results2) => {
                                if(results2.length > 0){
                                    console.log(results2[0].username, results2[0].password);
                                    res.render("signin", {username: results2[0].username, password: results2[0].password});
                                }
                                res.redirect("/");
                            });
                        }
                    }
                    else{
                        console.log("You are not eligible");
                    }
                });
            }
            else{
                res.send("Account already exists");
            }
        })
    }
    else{
        alert("Fill the fields");
    }
})


app.get("/home", (req, res) => {
    console.log("home session" , req.session);
    if (!req.session.user || req.session.user.type !== 'student') {
        return res.redirect('/');
    }

    // Render the home page for the student
    res.render("home", { username: req.session.user.username });
});


app.post("/home", function(req, res) {
    res.redirect("/dept");
})


app.get("/dept", function(req, res) {
    res.render("dept");
});


let deptid = 0;
app.post("/dept", (req, res) => {
    const dname = req.body.buttonValue;
    const loggedInUsername = req.session.user.username;
    console.log("dept at line 189: ", dname);

    pool.query('select * from departments where dname = ?', [dname], (err, results, fields) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Server error");
        }
        if(results.length > 0){
            console.log("results ", results);
            const deptid = results[0].deptid;
            req.session.deptid = deptid;
            console.log("deptid at line 200: ", deptid);
            console.log(loggedInUsername);
            res.render("register", {deptid: results[0].deptid});
            // res.redirect("/register");
        }
        else {
            res.status(404).send("Department not found");
        }
    });
})


app.get("/register", function(req, res) {
    // if (!req.session.deptid) {
    //     return res.redirect("/dept");
    // }
    res.render("register");
})

let compid;
app.post("/register", (req, res) => {
    if (!req.session.deptid || !req.session.user) {
        return res.redirect("/");
    }
    // console.log("deptid in register: ", deptid);
    // console.log("user in register: ", loggedInUsername);
    const deptid = req.session.deptid;
    const loggedInUsername = req.session.user.username;
    const today = new Date();
    console.log("today's date: ", today);
    let upvotes = 0;
    const content = req.body.content;

    console.log(content);

    pool.query('insert into complaints(userid, deptid, date, description, upvotes, status, remarks) values(?, ?, ?, ?, ?, ?, ?)', [loggedInUsername, deptid, today, content, upvotes, "Sent", "-"], (err, results, fields) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Server error");
        }
        else if(!err){
            if(results){
                // console.log(results);
                pool.query('select max(cid) from complaints', (err, results2, fields) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).send("Server error");
                    }
                    if(results2.length > 0){
                        console.log(results2);
                        compid = results2[0]['max(cid)'];
                        console.log(compid);
                        // console.log(deptid);
                        pool.query('insert into complaint_dept(cid, deptid) values(?, ?)', [compid, deptid], (err, results1, fields) => {
                            if (err) {
                                console.error(err);
                                return res.status(500).send("Server error");
                            }
                            pool.query('INSERT INTO registers (cid, userid) VALUES (?, ?)', [compid, loggedInUsername], (err, results2) => {
                                if (err) {
                                    console.error(err);
                                    return res.status(500).send("Server error");
                                }
    
                                res.redirect("/completed");
                            });
                        });
                    }
                })
            }
            else {
                res.status(500).send("No complaint found");
            }
        }
    });
    // res.redirect("/completed");
})


app.get("/completed", (req, res) => {
    res.render("completed");
})


app.post("/completed", (req, res) => {
    res.redirect("/home");
})


// let complaints = [];

app.get("/complaints", function(req, res, next) {
    const loggedInUsername = req.session.user?.username;
    if (!loggedInUsername) {
        return res.redirect('/');
    }
    console.log(loggedInUsername);
    pool.query('SELECT cid, userid, dname, date, description, upvotes, status FROM complaints c join departments d on c.deptid = d.deptid where status = ? order by date desc',["Accepted"], (err, results, fields) => {
        // console.log("hello");
        if(err){
            return next(err);
        }
        console.log(results);
            if(results && results.length > 0){
                let complaints = [];
                for(var i = 0; i < results.length; i++){
                    complaints.push(results[i]);
                    console.log(complaints[i]);
                    let year = results[i].date.getFullYear().toString(); 
                    let month = (results[i].date.getMonth() + 1).toString().padStart(2, '0'); 
                    let day = results[i].date.getDate().toString().padStart(2, '0');
                    results[i].date = day +'-' + month + '-' + year ; 
                }
                const fetchUpvotesPromises = complaints.map(complaint => {
                    return new Promise((resolve, reject) => {
                        pool.query('SELECT * FROM upvotes WHERE userid = ? AND cid = ?', [loggedInUsername, complaint.cid], (err, results1, fields) => {
                            if (err) {
                                return reject(err);
                            }
                            complaint.upvoted = results1.length > 0;
                            resolve();
                        });
                    });
                });

                Promise.all(fetchUpvotesPromises)
                .then(() => {
                    res.render("complaints", { complaints: complaints, user: loggedInUsername });
                })
                .catch(next);
            }
            else{
                res.send("<h1>No complaints accepted yet</h1>");
            }
    });
    
})


app.post("/complaints/upvote", function(req, res, next) {
    const { cid } = req.body;
    const userid = req.session.user?.username;

    if (!userid) {
        return res.redirect('/');
    }
    pool.query('SELECT * FROM upvotes WHERE cid = ? AND userid = ?', [cid, userid], (err, results) => {
        if (err) return next(err);
        if (results.length > 0) {
            return res.json({ message: 'Already upvoted' });
        }
        pool.query('UPDATE complaints SET upvotes = upvotes + 1 WHERE cid = ?', [cid], (err, results) => {
            if (err) return res.status(500).json({ message: 'Database error', error: err });
            pool.query('INSERT INTO upvotes (userid, cid) VALUES (?, ?)', [userid, cid], (err, results) => {
                if (err) return res.status(500).json({ message: 'Database error', error: err });
                res.json({ message: 'Upvoted successfully' });
            });
        });
    });
});


app.post("/complaints/downvote", function(req, res, next) {
    const { cid } = req.body;
    const userid = req.session.user?.username;

    if (!userid) {
        return res.redirect('/signin');
    }
    pool.query('SELECT * FROM upvotes WHERE cid = ? AND userid = ?', [cid, userid], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        if (results.length === 0) {
            return res.json({ message: 'Not upvoted yet' });
        }
        pool.query('UPDATE complaints SET upvotes = upvotes - 1 WHERE cid = ?', [cid], (err, results) => {
            if (err) return res.status(500).json({ message: 'Database error', error: err });
            pool.query('DELETE FROM upvotes WHERE userid = ? AND cid = ?', [userid, cid], (err, results) => {
                if (err) return res.status(500).json({ message: 'Database error', error: err });
                res.json({ message: 'Downvoted successfully' });
            });
        });
    });
});


// let mycomplaints = [];
app.get("/mycomplaints", function(req, res) {
    const loggedInUsername = req.session.user?.username;
    if (!loggedInUsername) {
        return res.redirect('/');
    }
    console.log(loggedInUsername);
    pool.query('SELECT cid, deptid, date, description, upvotes, status, remarks FROM complaints WHERE userid = ? order by date desc', [loggedInUsername], (err, results, fields) => {
        if (err) {
            return res.status(500).json({ message: 'Database error', error: err });
        }
        // console.log(results);
        if(results && results.length > 0){
            // console.log(results);
            let mycomplaints = [];
            for(var i = 0; i < results.length; i++){
                mycomplaints.push(results[i]);
                console.log(mycomplaints[i]);
                let year = results[i].date.getFullYear().toString(); 
                let month = (results[i].date.getMonth() + 1).toString().padStart(2, '0'); 
                let day = results[i].date.getDate().toString().padStart(2, '0');
                results[i].date = day +'-' + month + '-' + year ; 
            }
            res.render("mycomplaints", { mycomplaints: mycomplaints });
        }  
        else{
            res.send("<h1><en>No complaints registered....<en><h1>");
        }      
        // for(var i = 0; i < mycomplaints.length; i++){
        //     res.render("mycomplaints", {mycomplaints: mycomplaints});
        //     mycomplaints = [];
        // }
    });
})


app.post("/mycomplaints", function(req, res, next) {
    res.redirect("/complaints");
})


app.post("/mycomplaints/withdraw", (req, res) => {
    const { cid } = req.body;
    // delete from complaints table
    pool.query('delete from complaint_dept where cid = ?', [cid], (err, results, fields) => {
        if(err) {
            console.error("Error deleting entry from complaint_dept table: ", err);
            return res.status(500).send("Error withdrawing complaint");
        }

        // delete from complaint_dept table
        pool.query('delete from registers where cid=?', [cid], (err, results, fields) => {
            if(err) {
                console.error("Error deleting entry from registers table: ", err);
                return res.status(500).send("Error withdrawing complaint");
            }

            // delete from registers table
            pool.query('delete from complaints where cid=?', [cid], (err, results, fields) => {
                if (err) {
                    console.error("Error deleting entry from complaint:", err);
                    return res.status(500).send("Error withdrawing complaint");
                }
                console.log("Complaint withdrawn");
                return res.status(200).send("Complaint withdrawn successfully");
            })
        })
    })
})


app.get("/dhome", function(req, res) {
    // console.log(loggedInDusername);
    if (!req.session.user || req.session.user.type !== 'department') {
        return res.redirect('/');
    }
    pool.query('SELECT cid FROM complaints c join departments d on c.deptid = d.deptid WHERE dusername = ?', [loggedInDusername], (err, results, fields) => {
        let noofcomplaints;
        if(results && results.length > 0){
            console.log(results.length);
            noofcomplaints = results.length;
            console.log(noofcomplaints);
            res.render("dhome", {noofcomplaints : noofcomplaints, dusername: req.session.user.username});
        }
        else if(results.length === 0){
            res.render("dhome", {noofcomplaints : 0, dusername: req.session.user.username});
        }
    })
})


app.get("/dcomplaints", (req, res) => {
    console.log("inside dcomplaints");
    console.log("session", req.session);
    const loggedInDusername = req.session.user?.username;
    console.log("dusername", loggedInDusername);

    if (!loggedInDusername) {
        return res.redirect('/');
    }
    pool.query('SELECT * FROM departments WHERE dusername = ?',[loggedInDusername], (err, results1, fields) => {
        if(results1 && results1.length > 0){
            console.log(results1);
            let deptid = results1[0].deptid;
            console.log(deptid);
            console.log("Inside dcomplaints");
            pool.query('SELECT cid, userid, date, description, upvotes, status, remarks FROM complaints c join departments d on c.deptid = d.deptid WHERE d.deptid = ? order by upvotes desc', [deptid], (err, results, fields) => {
                if(results.length > 0){
                    let dcomplaints = [];
                    // console.log("Inside if");
                    for(var i = 0; i < results.length; i++){
                        dcomplaints.push(results[i]);
                        let year = results[i].date.getFullYear().toString(); 
                        let month = (results[i].date.getMonth() + 1).toString().padStart(2, '0'); 
                        let day = results[i].date.getDate().toString().padStart(2, '0');
                        results[i].date = day +'-' + month + '-' + year ; 
                        console.log(results[i].date);
                        console.log(dcomplaints[i]);
                    }
                    res.render("dcomplaints", { dcomplaints: dcomplaints, action: 'view', title: 'Complaints' });
                    dcomplaints = [];
                }       
                else {
                    res.render("dcomplaints", { dcomplaints: [], action: 'view', title: 'Complaints' });
                }
            });
        }
        else {
            res.render("dcomplaints", { dcomplaints: [], action: 'view', title: 'Complaints' });
        }
        
    })
})


app.get("/dashboard", function(req, res) {
    if (!req.session.user) {
        return res.redirect('/signin');
    }
    // console.log("dusername: ", loggedInDusername);

    let total = 0;
    let accept = 0;
    let yettobechecked = 0;
    let progress = 0;
    let dashboard = [];

    pool.query('SELECT * FROM departments WHERE dusername = ?', [loggedInDusername], (err, results1) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Server error");
        }

        if (results1.length > 0) {
            console.log("results > 0");
            let deptid = results1[0].deptid;
            console.log(deptid);

            // Query for complaints
            pool.query(
                'SELECT cid, userid, date, description, upvotes, status, remarks FROM complaints c JOIN departments d ON c.deptid = d.deptid WHERE d.deptid = ? AND status = "In Progress" ORDER BY upvotes DESC',
                [deptid],
                (err, results) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).send("Server error");
                    }

                    if (results.length > 0) {
                        results.forEach(result => {
                            dashboard.push(result);
                            let year = result.date.getFullYear().toString();
                            let month = (result.date.getMonth() + 1).toString().padStart(2, '0');
                            let day = result.date.getDate().toString().padStart(2, '0');
                            result.date = `${day}-${month}-${year}`;
                            console.log(result.date);
                            console.log(result);
                        });
                    }

                    // Run all count queries in parallel
                    Promise.all([
                        new Promise((resolve, reject) => {
                            pool.query(
                                'SELECT COUNT(cid) AS count FROM complaints c JOIN departments d ON c.deptid = d.deptid WHERE dusername = ?',
                                [loggedInDusername],
                                (err, results4) => {
                                    if (err) return reject(err);
                                    total = results4[0].count;
                                    resolve();
                                }
                            );
                        }),
                        new Promise((resolve, reject) => {
                            pool.query(
                                'SELECT COUNT(cid) AS count FROM complaints c JOIN departments d ON c.deptid = d.deptid WHERE dusername = ? AND status = "Accepted"',
                                [loggedInDusername],
                                (err, results1) => {
                                    if (err) return reject(err);
                                    accept = results1[0].count;
                                    resolve();
                                }
                            );
                        }),
                        new Promise((resolve, reject) => {
                            pool.query(
                                'SELECT COUNT(cid) AS count FROM complaints c JOIN departments d ON c.deptid = d.deptid WHERE dusername = ? AND status = "Sent"',
                                [loggedInDusername],
                                (err, results2) => {
                                    if (err) return reject(err);
                                    yettobechecked = results2[0].count;
                                    resolve();
                                }
                            );
                        }),
                        new Promise((resolve, reject) => {
                            pool.query(
                                'SELECT COUNT(cid) AS count FROM complaints c JOIN departments d ON c.deptid = d.deptid WHERE dusername = ? AND status = "In Progress"',
                                [loggedInDusername],
                                (err, results3) => {
                                    if (err) return reject(err);
                                    progress = results3[0].count;
                                    resolve();
                                }
                            );
                        })
                    ]).then(() => {
                        res.render("dashboard", {
                            total: total,
                            accept: accept,
                            yettobechecked: yettobechecked,
                            progress: progress,
                            dashboard: dashboard
                        });
                    }).catch(err => {
                        console.error(err);
                        res.status(500).send("Server error");
                    });
                }
            );
        } else {
            res.render("dashboard", {
                total: total,
                accept: accept,
                yettobechecked: yettobechecked,
                progress: progress,
                dashboard: dashboard
            });
        }
    });
});



app.post("/dashboard", function(req, res) {
    res.redirect("/dcomplaints");
})


app.get("/dcomplaints/edit/:cid", function(req, res, next) {
    const loggedInDusername = req.session.user?.dusername;

    if (!loggedInDusername) {
        return res.redirect('/signin');
    }
    var cid = req.params.cid;
    pool.query(`SELECT * FROM complaints WHERE cid = ?`,[cid], (err, results) => {
        if (err) {
            console.log(err);
            return res.status(500).send(err);
        }
        console.log("results length");
        console.log(results.length);
        console.log("Results");
        console.log(results[0]);
        res.render("dcomplaints", { title: "Edit Complaint", action: "edit", dcomplaints: results[0], cid: cid});
    });
});


app.post("/dcomplaints/edit/:cid", function(req, res, next) {
    const loggedInDusername = req.session.user?.dusername;

    if (!loggedInDusername) {
        return res.redirect('/signin');
    }
    var cid = req.params.cid;
    var status = req.body.status;
    var remarks = req.body.remarks;
    pool.query(`UPDATE complaints SET status = "${status}", remarks = "${remarks}" WHERE cid = "${cid}"`, (err, results) => {
        if(err){
            throw err;
        }
        else{
            res.redirect("/dcomplaints");
        }
    })
})
