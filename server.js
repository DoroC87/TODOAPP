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

// PW暗号化
const bcrypt = require("bcrypt");
const saltRounds = 10;

// DBの接続
var db;

app.listen(process.env.PORT, function () {
  MongoClient.connect(process.env.DB_URL, (e, client) => {
    // エラー検知
    if (e) return console.log(e);

    db = client.db(process.env.SCHEMA);
  });
});

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
        // PW比較
        if (bcrypt.compareSync(input_pw, result.pw)) {
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

// [Register]初期表示
app.get("/register", function (req, res) {
  res.render("register.ejs");
});

// [Register]会員登録ボタン押下
// Dbへinsert処理
app.post("/register", function (req, res) {
  // アカウント情報検索
  db.collection("account").findOne({ id: req.body.id }, function (e, result) {
    if (e) return done(e);

    if (result) {
      res.send("入力されたIDは使用されてます、別のIDを入力してください。");
    } else {
      // 画面で入力した情報をDBへ登録
      db.collection("account").insertOne(
        {
          id: req.body.id,
          pw: hashedPW,
        },
        (e, result) => {
          console.log("insert complete!");
          res.redirect("/login");
        }
      );
    }
  });
});

// ログインチェック
function loginCheck(req, res, next) {
  if (req.user) next();
  else res.send("ログインしてください");
}

// [MyPage]初期表示
app.get("/mypage", loginCheck, function (req, res) {
  res.render("mypage.ejs", { userInfo: req.user.result });
});

// [Home]初期表示
app.get("/", loginCheck, function (req, res) {
  res.render("index.ejs");
});
// [Write]初期表示
app.get("/write", loginCheck, function (req, res) {
  res.render("write.ejs");
});

// [Write]submitボタン押下
// Dbへinsert処理
// 2022/08/15 add writer create_date update_date
app.post("/add", loginCheck, function (req, res) {
  // idのauto_increment情報検索
  db.collection("counter").findOne({ name: "datacount" }, (e, result) => {
    let totalcount = result.totalPost;
    // 画面で入力した情報をDBへ登録
    db.collection("post").insertOne(
      {
        _id: totalcount,
        title: req.body.title,
        date: req.body.date,
        writer: req.user.result.id,
        create_date: new Date(),
        update_date: new Date(),
      },
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
// 2022/08/15 本人作成データのみ表示追加
app.get("/list", loginCheck, function (req, res) {
  db.collection("post")
    .find({ writer: req.user.result.id })
    .toArray((e, result) => {
      res.render("list.ejs", { posts: result });
    });
});

// [List]削除ボタン押下
// Dbへdelete処理
app.delete("/delete", loginCheck, (req, res) => {
  //idを数字に変換
  req.body._id = parseInt(req.body._id);
  db.collection("post").deleteOne(req.body, (e, result) => {
    console.log("Delete Complete!");
    res.status(200).send({ message: "Complete" });
  });
});

// [Detail]初期表示
app.get("/detail/:id", loginCheck, (req, res) => {
  db.collection("post").findOne(
    { _id: parseInt(req.params.id) },
    (e, result) => {
      res.render("detail.ejs", { data: result });
    }
  );
});

// [Edit]初期表示
app.get("/edit/:id", loginCheck, (req, res) => {
  db.collection("post").findOne(
    { _id: parseInt(req.params.id) },
    (e, result) => {
      res.render("edit.ejs", { data: result });
    }
  );
});

// [Edit]modifyボタン押下
// Dbへupdate処理
// 2022/08/15 add update_date
app.put("/modify", loginCheck, (req, res) => {
  db.collection("post").updateOne(
    { _id: parseInt(req.body.id) },
    {
      $set: {
        title: req.body.title,
        date: req.body.date,
        update_date: new Date(),
      },
    },
    (e, result) => {
      console.log("Modify Complete!");
      res.redirect("/list");
    }
  );
});
