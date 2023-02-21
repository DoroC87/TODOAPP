const express = require("express");
const app = express();
const bodyParser = require("body-parser");
app.use(express.urlencoded({ extended: true }));

const MongoClient = require("mongodb").MongoClient;
app.set("view engine", "ejs");

app.use("/public", express.static("public"));
/** method-override */
const methodOverride = require("method-override");
app.use(methodOverride("_method"));

/** session login */
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const session = require("express-session");
/** middleware */
app.use(session({ secret: "dorothy", resave: true, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

var db;
MongoClient.connect(
  "mongodb+srv://admin:qwer1234@cluster0.kbtphjb.mongodb.net/todoapp?retryWrites=true&w=majority",
  (e, client) => {
    db = client.db("todoapp");
    app.listen(8080, function () {
      console.log("listening on 8080");
    });
  }
);

app.get("/", function (req, res) {
  res.render("index.ejs");
});

app.get("/write", function (req, res) {
  res.render("write.ejs");
});

/**
 * 할 일 submit 처리
 * post collection insert
 * @param req {title:오늘의 할일, date:날짜}
 * @param res respons
 */
app.post("/add", (req, res) => {
  db.collection("counter").findOne({ name: "countPost" }, (e, result) => {
    if (e) return console.log(e);
    var totalPost = result.totalPost;
    db.collection("post").insertOne(
      { _id: totalPost + 1, title: req.body.title, date: req.body.date },
      (e, postResult) => {
        db.collection("counter").updateOne(
          { name: "countPost" },
          { $inc: { totalPost: 1 } },
          function (e, result) {
            if (e) return console.log(e);
            res.send("send complete");
          }
        );
      }
    );
  });
});

/**
 * 할 일 list find 처리
 * post collection all find
 * @param req
 * @param res respons
 */
app.get("/list", (req, res) => {
  db.collection("post")
    .find()
    .toArray(function (e, result) {
      res.render("list.ejs", { posts: result });
    });
});

app.delete("/delete", (req, res) => {
  req.body._id = parseInt(req.body._id);
  db.collection("post").deleteOne(req.body, function (e, result) {
    res.status(200).send({ message: "succesed" });
  });
  // res.send("delete complete");
});

app.get("/detail/:id", (req, res) => {
  db.collection("post").findOne(
    { _id: parseInt(req.params.id) },
    function (e, result) {
      res.render("detail.ejs", { data: result });
    }
  );
});

app.get("/edit/:id", (req, res) => {
  db.collection("post").findOne(
    { _id: parseInt(req.params.id) },
    function (e, result) {
      res.render("edit.ejs", { data: result });
    }
  );
});

app.put("/edit", function (req, res) {
  db.collection("post").updateOne(
    { _id: parseInt(req.body.id) },
    { $set: { title: req.body.title, date: req.body.date } },
    function (e, result) {
      res.redirect("/list");
    }
  );
});

/** GET : login */
app.get("/login", function (req, res) {
  res.render("login.ejs");
});
app.post(
  "/login",
  passport.authenticate("local", { failureRedirect: "/fail" }),
  function (req, res) {
    res.redirect("/");
  }
);

// 사용자 ID검증부분
passport.use(
  new LocalStrategy(
    {
      usernameField: "id",
      passwordField: "pw",
      session: true,
      passReqToCallback: false,
    },
    function (id, pw, done) {
      db.collection("login").findOne({ id: id }, function (e, result) {
        if (e) return done(e);
        if (!result)
          return done(null, false, { message: "존재하지않는 아이디요" });
        if (pw == result.pw) {
          return done(null, result);
        } else {
          return done(null, false, { message: "비번틀렸어요" });
        }
      });
    }
  )
);
// id를 이용해 세션을 저장시키는 코드(로그인 성공시 발동)
passport.serializeUser(function (user, done) {
  done(null, user.id);
});
// 이 세션 데이터를 가진 사람을 DB에서 찾아주세요(마이페이지 접속시 발동)
passport.deserializeUser(function (id, done) {
  done(null, {});
});
