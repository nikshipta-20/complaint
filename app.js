const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mysql = require("mysql2");
// const encoder = bodyParser.urlencoded();
const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true})); 
app.use(express.static("public"));
app.use(bodyParser.json());
app.use(express.json());

const pool = mysql.createPool({
    host: 'badjojjezuaihubgeijd-mysql.services.clever-cloud.com',
    user: 'uhy7wqexbc0jyleo',
    password: 'Oq4l18OqGJVJ2855zyKr',
    database: 'badjojjezuaihubgeijd'
});

pool.getConnection(function(err) {
    if(err) throw err;
    else console.log("Successfully connected to database");
})

// pool.query('select * from nit_student where branch=?',['cse'], (err, results, fields) => {
//     if(err){
//         return console.log(err);
//     }
//     else{
//         return console.log(results);
//     }
// })

let user;
let complaint =[];
let deptid;
let dname;
let content;
let date = new Date();
let cid;
let duser;
let complaints = [];
let compid;
let mycomplaints =[];
let didd;
let dcomplaints =[];
let did;
let today;
let day, month, year;
let drecent = [];
let rcid, rrollno, rdeptid, rdate, rdesc, rupvotes, rstatus, rremarks;
let r1cid, r1deptid;
let upvote;

function goToDiv() {
    const targetDiv = document.getElementById('complaint');
    targetDiv.scrollIntoView({ behavior: 'smooth' });
  }  
  

app.get("/signin", function(req, res) {
    res.render("signin");
})

app.post("/signin", function(req, res) {
    const lusername = req.body.username;
    const password = req.body.password;

    const dusername = req.body.dusername;
    const dpassword = req.body.dpassword;
    // console.log(password);
    // console.log(req.body.password);
    if(lusername && password){
        pool.query('SELECT * FROM student WHERE rollno=? and password=?',[lusername, password], (err, results, fields) => {
            console.log(results);
            if(err){
                alert(err);
            }
            if(results.length > 0){
                
                if(results[0].password === password){
                    user = lusername;
                    console.log(user);
                    res.render("home",{username : results[0].username, password : results[0].password });
                    // res.redirect("/home");
                }
                // else{
                //     res.send("Incorrect Password");
                //     res.render("signin");
                // }
            }
            else{
                res.send("<h1>Incorrect Username and/or Password</h1>");
                res.render("signin");
            }
            res.end();
        });
    }

    if(dusername && dpassword){
        pool.query('SELECT * FROM dadmin WHERE dusername=? and dpassword=?', [dusername, dpassword], (err, results1, fields) => {
            console.log(results1);
            if(err){
                console.log(err);
            }
            if(results1.length > 0){
                if(results1[0].dpassword == dpassword){
                    duser = dusername;
                    console.log(duser);
                    res.redirect("/dhome");
                    res.render("dhome", {dusername: results1[0].dusername, dpassword: results1[0].dpassword});
                }
            }
            else{
                res.send("<h1>Incorrect details of admin</h1>");
                res.render("signin");
            }
            res.end();
        })
    }
    
})

app.get("/signup", function(req, res) {
    res.render("signup");
})

app.post("/signup", function(req, res) {
    let username = req.body.username;
    let password = req.body.password;
    let passwordConfirmation = req.body.passwordConfirmation;

    if(username && password && passwordConfirmation){
        pool.query('SELECT * FROM student where rollno = ?',[username], (err, results, fields) => {
            // console.log(results);
            // console.log(results.length);
            if(results.length === 0){
                pool.query('SELECT * FROM nit_student where rollno = ?',[username], (err, results1) => {
                    if(results1.length > 0){
                        if(password != passwordConfirmation){
                            res.send("<h1>Passwords not matching<h1>");
                            res.render("signup");
                        }
                        else{
                            // query = 'INSERT INTO student (rollno, password) VALUES (?)';
                            // var values = [results1[0].username, password];
                            pool.query('INSERT INTO student (rollno, password) VALUES (?, ?)', [username, password], (err, results2) => {
                                if(results2.length === 0){
                                    res.render("signin", {username: results2[0].username, password: results2[0].password});
                                }
                                res.redirect("/signin");
                            });
                        }     
                    } 
                });
                
            }
            else if(results.length > 0){
                res.send("<h1>Account already existing<h1>");
                // res.render("signin");
            }
        })
        // res.end();
    }
    // res.redirect("/home");
})

app.get("/home", function(req, res) {
    res.render("home");
})

app.post("/home", function(req, res) {
    res.redirect("/dept");
})

app.get("/dept", function(req, res) {
    res.render("dept");
});

app.post("/dept", function(req, res) {
    dname = req.body.buttonValue;
    console.log(req.body.buttonValue);

    pool.query('SELECT * FROM department WHERE dname = ?', [dname], (err, results, fields) => {
        if(results.length > 0){
            console.log(results);
            deptid = results[0].deptid;
            console.log(deptid);
            console.log(user);
            res.render("register", {deptid: results[0].deptid});
        }
    });
    res.redirect("/register");
    res.end();
});

app.get("/register", function(req, res) {
    res.render("register");
})

app.post("/register", function(req, res, next) {
    console.log("1");
    console.log(user);
    console.log(deptid);
    // console.log(date);
    // // date = date.toLocaleDateString('en-GB');
    // year = date.getFullYear().toString(); 
    // month = (date.getMonth() + 1).toString().padStart(2, '0'); 
    // day = date.getDate().toString().padStart(2, '0');
    // date = year + '-' + month + '-' + day; 
    console.log(date);
    let upvotes = 0;
    content = req.body.content;
    console.log(content);
    pool.query('INSERT INTO complaints(rollno, deptid, date, description, upvotes, status, remarks)VALUES(?, ?, ?, ?, ?, ?, ?)', [user, deptid, date, content, upvotes, 'Sent', '-'], (err, results, fields) => {
        if(!err){
            if(results){
                console.log(results);
                pool.query('SELECT MAX(cid) FROM complaints', (err, results2, fields) => {
                    if(results2.length > 0){
                        console.log(results2);
                        compid = results2[0]['MAX(cid)'];
                        console.log(compid);
                        console.log(deptid);
                        pool.query('INSERT INTO complaint_dept(cid, deptid)VALUES(?, ?)',[compid, deptid], (err, results1, fields) => {
                            if(!err){
                                if(results1.length == 0){
                                    console.log(results1);
                                    res.render("completed", {results1: results1, results: results});
                                }
                            }
                            // else{
                            //     console.log(err);
                            // }
                        });
                        pool.query('INSERT INTO registers(cid, rollno)VALUES(?, ?)',[compid, user], (err, results2, fields) => {
                            if(!err){
                                if(results2.length == 0){
                                    console.log(results2);
                                    res.render("completed", {results2: results2, results: results});
                                }
                            }
                            // else{
                            //     console.log(err);
                            // }
                        });
                    }
                    else{
                        console.log(err);
                    }
                })
                
            }
        }
        // else{
        //     console.log(err);
        // }
    });
    res.redirect("/completed");
})

app.get("/completed", function(req, res) {
    res.render("completed", {complaint: complaint});
})

app.post("/completed", function(req, res) {;
    res.redirect("/home");
})

app.get("/contact", function(req, res) {
    res.render("contact");
})

app.get("/complaints", function(req, res, next) {
    console.log(user);
    pool.query('SELECT cid, rollno, dname, date, description, upvotes, status FROM complaints c join department d on c.deptid = d.deptid where status = ? order by date desc',["Accepted"], (err, results, fields) => {
            if(results && results.length > 0){
                for(var i = 0; i < results.length; i++){
                    complaints.push(results[i]);
                    console.log(complaints[i]);
                    year = results[i].date.getFullYear().toString(); 
                    month = (results[i].date.getMonth() + 1).toString().padStart(2, '0'); 
                    day = results[i].date.getDate().toString().padStart(2, '0');
                    results[i].date = day +'-' + month + '-' + year ; 
                }
                res.render("complaints", {complaints:complaints, user: user});
            }
    });
    console.log(user);

    for(var i = 0; i < complaints.length; i++){
        res.render("complaints", {complaints:complaints, user: user});
    }
    complaints=[];
    // next();
    
})

let comid;

app.post('/complaints', function (req, res) { 
    console.log(1);
    res.redirect("/complaints");       
});

let upv;
let upv1;
let upvotes = [];

app.get("/complaints/upvote/:cid/:user", function(req, res, next) {
    var cid = req.params.cid;
    var rollno = req.params.user;
    console.log(rollno);
    console.log(cid);

    pool.query('SELECT upvotes FROM complaints WHERE cid = ?', [cid], (err, results1, fields) => {
        console.log("inside selecting upvotes from complaints query");
        if(results1 && results1.length > 0){
            console.log(results1);
            console.log("upvotes from complaints of cid is:");
            upv = results1[0].upvotes;
            console.log(upv);
            res.render("complaints", {complaints: complaints, user: user});   
        }
        else{
            res.render("complaints", {complaints: complaints, user: user});
        } 
            
    })
    // upv = upv+1;
    upv1 = upv;
    // console.log(upv);
    pool.query('UPDATE complaints SET upvotes = ? WHERE cid = ?', [upv+1, cid], (err, results4, fields) => {
        console.log("updating the number of upvotes");
        if(results4){
            // upv1 = upv;
            console.log("updated in complaints");
            console.log(results4);
            // res.render("complaints", {complaints: complaints, user: user});
        }
    })
    
    pool.query('SELECT cid, rollno FROM upvotes WHERE cid = ? AND rollno = ?',[cid, rollno], (err, results6, fields) => {
        console.log("checking the data if it is pesent in upvotes table")
        if(results6 && results6.length > 0){
            for(var i = 0; i < results6.length; i++){
                upvotes.push(results6[i]);
                console.log(upvotes[i]); 
            }
        }
        if(upvotes.length == 0){
            console.log("not found in upvotes table")
            pool.query('INSERT INTO upvotes(rollno, cid)VALUES(?, ?)', [rollno, cid], (err, results2, fields) => {
                console.log("so inserting the data in upvotes table");
                if(!err){
                    if(results2){
                        console.log("inserted in upvotes");
                        console.log(results2);
                        res.render("complaints", {complaints: complaints, user: user});
                        // res.redirect("/complaints");
                    }

                }
            })
            
        }
        else{
            console.log("already present in upvotes table");
            pool.query('UPDATE complaints SET upvotes = ? WHERE cid = ?', [upv1, cid], (err, results4, fields) => {
                console.log("so trying to change the updated number of upvotes");
                if(results4){
                    console.log(results4);
                    res.render("complaints", {complaints: complaints, user: user});
                    // res.redirect("/complaints");
                }
            })
        }
        
    });
    
});

app.post("/complaints/upvote/:cid/:user", function(req, res, next) {
    res.redirect("/complaints");
})


app.get("/complaints/downvote/:cid/:user", function(req, res) {
    var cid = req.params.cid;
    var rollno = req.params.user;
    console.log(rollno);
    console.log(cid);

    pool.query('SELECT upvotes FROM complaints WHERE cid = ?', [cid], (err, results1, fields) => {
        // console.log("inside upvotes query");
        if(results1 && results1.length > 0){
            console.log(results1);
            console.log("upvotes:");
            upv = results1[0].upvotes;
            console.log(upv);
            res.render("complaints", {complaints: complaints, user: user});   
        }
        else{
            res.render("complaints", {complaints: complaints, user: user});
        } 
            
    })
    // upv = upv+1;
    console.log(upv);
    pool.query('UPDATE complaints SET upvotes = ? WHERE cid = ?', [upv-1, cid], (err, results4, fields) => {
        if(results4){
            console.log(results4);
            // res.render("complaints", {complaints: complaints, user: user});
        }
    })
    
    pool.query('SELECT cid, rollno FROM upvotes WHERE cid = ? AND rollno = ?',[cid, rollno], (err, results6, fields) => {
        if(results6 && results6.length > 0){
            for(var i = 0; i < results6.length; i++){
                upvotes.push(results6[i]);
                console.log(upvotes[i]); 
            }
        }
        if(upvotes.length == 0){
            // pool.query('INSERT INTO upvotes(rollno, cid)VALUES(?, ?)', [rollno, cid], (err, results2, fields) => {
            //     if(!err){
            //         if(results2){
            //             console.log("inserted in upvotes");
            //             console.log(results2);
            //             res.render("complaints", {complaints: complaints, user: user});
            //         }
            //     }
            // })
            
        }
        else{
            pool.query('DELETE FROM upvotes(rollno, cid)VALUES(?, ?)', [rollno, cid], (err, results2, fields) => {
                    if(!err){
                        if(results2){
                            console.log("deleted from upvotes");
                            console.log(results2);
                            res.render("complaints", {complaints: complaints, user: user});
                        }
                    }
                })
            // pool.query('UPDATE complaints SET upvotes = ? WHERE cid = ?', [upv-1, cid], (err, results4, fields) => {
            //     if(results4){
            //         console.log(results4);
            //         res.render("complaints", {complaints: complaints, user: user});
            //     }
            // })
        }
    });
    
})

app.post("/complaints/downvote/:cid/:user", (req, res) =>{
    res.redirect("/complaints");
})

app.get("/mycomplaints", function(req, res) {
    console.log(user);
    pool.query('SELECT cid, dname, date, description, upvotes, status, remarks FROM complaints c join department d on c.deptid = d.deptid WHERE rollno = ? order by date desc', [user], (err, results, fields) => {
        if(results && results.length > 0){
            for(var i = 0; i < results.length; i++){
                mycomplaints.push(results[i]);
                console.log(mycomplaints[i]);
                year = results[i].date.getFullYear().toString(); 
                month = (results[i].date.getMonth() + 1).toString().padStart(2, '0'); 
                day = results[i].date.getDate().toString().padStart(2, '0');
                results[i].date = day +'-' + month + '-' + year ; 
            }
        }  
        else{
            res.send("<h1><en>No complaints registered....<en><h1>");
        }      
        for(var i = 0; i < mycomplaints.length; i++){
            res.render("mycomplaints", {mycomplaints: mycomplaints});
            mycomplaints = [];
        }
    });
})

app.post("/mycomplaints", function(req, res, next) {
    if(err){
       res.redirect("/complaints");
    }
    res.redirect("/complaints");
    req.next();
})

let noofcomplaints;

app.get("/dhome", function(req, res) {
    console.log(duser);
    // pool.query('SELECT deptid from dadmin where dusername = ?',[duser], (err, results1, fields) => {
    //     if(results1){
    //         console.log(results1[0]);
    //     }
    // })
    pool.query('SELECT cid FROM complaints c join dadmin d on c.deptid = d.deptid WHERE dusername = ?', [duser], (err, results, fields) => {
        console.log("1");
        console.log(results.length);
        if(results && results.length > 0){
            console.log(results.length);
            noofcomplaints = results.length;
            console.log(noofcomplaints);
            res.render("dhome", {noofcomplaints : noofcomplaints});
        }
        // else{
        //     console.log(err);
        // }
    })
})


let accepted = [];

app.get("/dcomplaints", function(req, res) {
    pool.query('SELECT * FROM department d JOIN dadmin da on d.deptid = da.deptid WHERE da.dusername = ?',[duser], (err, results1, fields) => {
        if(results1 && results1.length > 0){
            console.log(results1);
            didd = results1[0].deptid;
            console.log(didd);
            console.log("Inside dcomplaints");
            pool.query('SELECT cid, rollno, date, description, upvotes, status, remarks FROM complaints c join department d on c.deptid = d.deptid WHERE d.deptid = ? order by upvotes desc', [didd], (err, results, fields) => {
                console.log(results);
                console.log("Inside query");
                if(results.length > 0){
                    console.log("Inside if");
                    for(var i = 0; i < results.length; i++){
                        dcomplaints.push(results[i]);
                        year = results[i].date.getFullYear().toString(); 
                        month = (results[i].date.getMonth() + 1).toString().padStart(2, '0'); 
                        day = results[i].date.getDate().toString().padStart(2, '0');
                        results[i].date = day +'-' + month + '-' + year ; 
                        console.log(results[i].date);
                        console.log(dcomplaints[i]);
                    }
                    for(var i = 0; i < dcomplaints.length; i++){
                        res.render("dcomplaints", {dcomplaints: dcomplaints, action: 'view', title: 'Complaints'});
                        dcomplaints = [];
                    }
                    
                }       
            });
            
        }
        
    })
    
})

let complaintid;

let dashboard = [];
let yettobechecked;
let accept;
let progress;
let total;

app.get("/dashboard", function(req, res) {
    pool.query('SELECT * FROM department d JOIN dadmin da on d.deptid = da.deptid WHERE da.dusername = ?',[duser], (err, results1, fields) => {
        if(results1 && results1.length > 0){
            console.log(results1);
            didd = results1[0].deptid;
            console.log(didd);
            pool.query('SELECT cid, rollno, date, description, upvotes, status, remarks FROM complaints c join department d on c.deptid = d.deptid WHERE d.deptid = ? and status = "In Progress" order by upvotes desc', [didd], (err, results, fields) => {
                if(results && results.length > 0){
                    for(var i = 0; i < results.length; i++){
                        dashboard.push(results[i]);
                        year = results[i].date.getFullYear().toString(); 
                        month = (results[i].date.getMonth() + 1).toString().padStart(2, '0'); 
                        day = results[i].date.getDate().toString().padStart(2, '0');
                        results[i].date = day +'-' + month + '-' + year ; 
                        console.log(results[i].date);
                        console.log(dashboard[i]);
                    }
                    
                    pool.query('SELECT cid FROM complaints c join dadmin d on c.deptid = d.deptid WHERE dusername = ?', [duser], (err, results1, fields) => {
                        
                        console.log(results1.length);
                        if(results && results1.length > 0){
                            console.log(results1.length);
                            total = results1.length;
                            console.log(total);
                            // res.render("dashboard", {accept : accept});
                        }
                        else{
                            total = 0;
                        }
                    });

                    pool.query('SELECT cid FROM complaints c join dadmin d on c.deptid = d.deptid WHERE dusername = ? and status = "Accepted"', [duser], (err, results1, fields) => {
                        
                        console.log(results1.length);
                        if(results && results1.length > 0){
                            console.log(results1.length);
                            accept = results1.length;
                            console.log(accept);
                            // res.render("dashboard", {accept : accept});
                        }
                        else{
                            accept = 0;
                        }
                        // else{
                        //     console.log(err);
                        // }
                    })

                    pool.query('SELECT cid FROM complaints c join dadmin d on c.deptid = d.deptid WHERE dusername = ? and status = "Sent"', [duser], (err, results2, fields) => {
                        
                        console.log(results2.length);
                        if(results && results2.length > 0){
                            console.log(results2.length);
                            yettobechecked = results2.length;
                            console.log(yettobechecked);
                            // res.render("dashboard", {yettobechecked : yettobechecked});
                        }
                        else{
                            yettobechecked = 0;
                        }
                        // else{
                        //     console.log(err);
                        // }
                    })
                    pool.query('SELECT cid FROM complaints c join dadmin d on c.deptid = d.deptid WHERE dusername = ? and status = "In Progress"', [duser], (err, results3, fields) => {
                        
                        console.log(results3.length);
                        if(results && results3.length > 0){
                            console.log(results3.length);
                            progress = results3.length;
                            console.log(progress);
                            // res.render("dashboard", {progress : progress});
                        }
                        else{
                            progress = 0;
                        }
                        // else{
                        //     console.log(err);
                        // }
                    })

                    // for(var i = 0; i < dashboard.length; i++){
                        res.render("dashboard", {total: total, accept: accept, yettobechecked: yettobechecked, progress: progress, dashboard: dashboard});
                        dashboard = [];
                    // }
                }
                // else{
                //     console.log(err);
                // }        
                
            });
            
        }
        // else{
        //     console.log(err);
        // }
    })
    
})

app.post("/dashboard", function(req, res) {
    res.redirect("/dcomplaints");
})

app.get("/dcomplaints/edit/:cid", function(req, res, next) {
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


app.listen(3500, function() {
    console.log("Server started on port 3500");
  });