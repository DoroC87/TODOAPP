const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

// 外部ライブラリ：method-override
const methodOverride = require("method-override");
const { Db } = require("mongodb");
app.use(methodOverride("_method"));

// 環境変数設定
require("dotenv").config();

// ログイン用(session)
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const session = require("express-session");
app.use(
  session({ secret: "secretCode", resave: true, saveUninitialized: false })
);
app.use(passport.initialize());
app.use(passport.session());

// [Login]初期表示
app.get("/login", function (req, res) {
  res.render("login.ejs");
});
// [Login]submitボタン押下
app.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/fail",
  }),
  function (req, res) {
    res.redirect("/");
  }
);
// ログイン認証
passport.use(
  new LocalStrategy(
    {
      usernameField: "id",
      passwordField: "pw",
      session: true,
      passReqToCallback: false,
    },
    function (input_id, input_pw, done) {
      // アカウント情報検索
      db.collection("account").findOne({ id: input_id }, function (e, result) {
        if (e) return done(e);

        if (!result)
          return done(null, false, {
            message: "該当するアカウントを見つかれませんでした。",
          });
        if (input_pw == result.pw) {
          return done(null, result);
        } else {
          return done(null, false, {
            message:
              "パスワードが異なります。パスワードのご確認のうえお願いします",
          });
        }
      });
    }
  )
);

// ログイン成功後、セッション生成
passport.serializeUser(function (user, done) {
  done(null, user.id);
});
// ログインユーザーの情報格納
passport.deserializeUser(function (id, done) {
  db.collection("account").findOne({ id: id }, function (e, result) {
    done(null, { result });
  });
});

// ログインチェック
function loginCheck(req, res, next) {
  if (req.user) next();
  else res.send("ログインしてください");
}

// [MyPage]初期表示
app.get("/mypage", loginCheck, function (req, res) {
  console.log(req.user.result);
  res.render("mypage.ejs", { userInfo: req.user.result });
});

// DBの接続
var db;

app.listen(8080, function () {
  MongoClient.connect(process.env.DB_URL, (e, client) => {
    // エラー検知
    if (e) return console.log(e);

    db = client.db("todoapp");
  });
});

// [Home]初期表示
app.get("/", function (req, res) {
  res.render("index.ejs");
});
// [Write]初期表示
app.get("/write", function (req, res) {
  res.render("write.ejs");
});

// [Write]submitボタン押下
// Dbへinsert処理
app.post("/add", function (req, res) {
  // idのauto_increment情報検索
  db.collection("counter").findOne({ name: "datacount" }, (e, result) => {
    let totalcount = result.totalPost;
    // 画面で入力した情報をDBへ登録
    db.collection("post").insertOne(
      { _id: totalcount, title: req.body.title, date: req.body.date },
      (e, result) => {
        console.log("insert complete!");
        // idのauto_increment増加
        db.collection("counter").updateOne(
          { name: "datacount" },
          { $inc: { totalPost: 1 } },
          (e, result) => {
            return console.log(e);
          }
        );
      }
    );
    res.redirect("/list");
  });
});

// [List]初期表示
app.get("/list", function (req, res) {
  db.collection("post")
    .find()
    .toArray((e, result) => {
      res.render("list.ejs", { posts: result });
    });
});

// [List]削除ボタン押下
// Dbへdelete処理
app.delete("/delete", (req, res) => {
  //idを数字に変換
  req.body._id = parseInt(req.body._id);
  db.collection("post").deleteOne(req.body, (e, result) => {
    console.log("Delete Complete!");
    res.status(200).send({ message: "Complete" });
  });
});

// [Detail]初期表示
app.get("/detail/:id", (req, res) => {
  db.collection("post").findOne(
    { _id: parseInt(req.params.id) },
    (e, result) => {
      res.render("detail.ejs", { data: result });
    }
  );
});

// [Edit]初期表示
app.get("/edit/:id", (req, res) => {
  db.collection("post").findOne(
    { _id: parseInt(req.params.id) },
    (e, result) => {
      res.render("edit.ejs", { data: result });
    }
  );
});

// [Edit]modifyボタン押下
// Dbへupdate処理
app.put("/modify", (req, res) => {
  db.collection("post").updateOne(
    { _id: parseInt(req.body.id) },
    { $set: { title: req.body.title, date: req.body.date } },
    (e, result) => {
      console.log("Modify Complete!");
      res.redirect("/list");
    }
  );
});
