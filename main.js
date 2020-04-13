// phina.js をグローバル領域に展開
phina.globalize();

// 画面サイズ
const SCREEN_X = 800;
const SCREEN_Y = 600;
// 制限時間
const TIMELIMIT = 70;
// 使用素材
const ASSETS = {
  // 画像
  image: {
    'reimu': './graphics/reimu.png',
    'marisa': './graphics/marisa.png',
    'moji': './graphics/moji.png',
  },
  // アニメーション
  spritesheet: {
    'chara_ss': './chara_ss.ss',
  },
  // 音楽、効果音
  sound: {
    'start': './sounds/GameStart.wav',
    'cdown': './sounds/CountDown.wav',
    'ok': './sounds/OK.wav',
    'ng': './sounds/NG.wav',
    'result': './sounds/Result.wav',
    'music': './sounds/we_are_the_strongest.wav',
  },
}

// MyDisplayScene クラスを定義 毎回やる処理とかはここに記述
phina.define('MyDisplayScene', {
  superClass: 'DisplayScene',
  init: function() {
    // 親クラスの初期化
    this.superInit({
      width: SCREEN_X,
      height: SCREEN_Y,
    });
    // ぼやけ防止
    this.canvas.imageSmoothingEnabled = false;
    this.counter = 0;
  },
});

// ドットキャラクラスを定義 元画像の4倍サイズで表示しアニメーションの設定もする
phina.define('DotCharacter', {
  superClass: 'Sprite',
  init: function(image, ss, width, height) {
    this.superInit(image, width, height);
    this.setScale(4.0, 4.0);
    this.ss = FrameAnimation(ss).attachTo(this);
  },

  gotoAndPlay: function(anime) {
    this.ss.gotoAndPlay(anime);
  },

  gotoAndStop: function(anime) {
    this.ss.gotoAndStop(anime);
  },
});

phina.define('MyLabel', {
  superClass: 'Label',
  init: function(param){
    this.superInit(param);
    this.strokeWidth =  5;
  }
})

// 文字画像クラス
phina.define('Moji', {
  superClass: 'Sprite',
  init: function(i) {
    this.superInit('moji', 100, 100);
    this.frameIndex = i;
    this.correctIndex = i;
    this.onpointstart = function() {
      if(this.frameIndex == this.correctIndex)
        // 正しい文字の時に選択すると別の文字に
        this.changeIndex();
      else
        // 間違った文字の時に選択すると正しい文字に
        this.frameIndex = this.correctIndex
      this.y -= 40;
      this.tweener.moveBy(0, 40, 100, 'easeOutElastic').play();
    };
  },

  changeIndex: function() {
    this.frameIndex = (this.correctIndex + Random.randint(1,11)) % 12;
  }
});

// 問題作成クラス
phina.define('Qcreator', {
  init: function(mojis) {
    this.mojis = mojis;
  },
  createQuestion: function() {},
});

phina.define('EasyQcreator', {
  superClass: 'Qcreator',
  init: function(mojis) {
    this.superInit(mojis);
  },
  createQuestion: function() {
    this.mojis.children.random().changeIndex();
  },
});

phina.define('NormalQcreator', {
  superClass: 'Qcreator',
  init: function(mojis) {
    this.superInit(mojis);
  },
  createQuestion: function() {
    let i = Random.randint(0,3);
    this.mojis.children.at(i).changeIndex();
    i = i + Random.randint(1,3) % 4;
    this.mojis.children.at(i).changeIndex();
  },
});

phina.define('HardQcreator', {
  superClass: 'Qcreator',
  init: function(mojis) {
    this.superInit(mojis);
  },
  createQuestion: function() {
    let n = Random.randint(0,3);
    Array.range(4).each((i) => {
      if(i == n) return;
      this.mojis.children.at(i).changeIndex();
    });
  },
});

// スコアクラス
phina.define('Score', {
  superClass: 'DisplayElement',
  init: function() {
    this.superInit();
    this.s = 0;
    this.score = MyLabel({
      text: 'SCORE:0',
      fontSize: 40,
      fontWeight:'bold',
      fill: 'white',
      stroke: 'black',
    }).addChildTo(this);
    this.score.origin.set(0, 0);
    this.score.setPosition(SCREEN_X / 32, SCREEN_Y / 32);

    this.effect = MyLabel({
      fontSize: 30,
      stroke: 'white',
      fontWeight:'bold',
    }).addChildTo(this);
    this.effect.setPosition(SCREEN_X / 2, SCREEN_Y / 3);
    this.effect.alpha = 0;
  },

  getScore: function() {return this.s},

  addScore: function(ds) {
    this.s += ds;
    this.score.text = `SCORE:${this.s}`;
    this.score.setPosition(SCREEN_X / 32, SCREEN_Y / 32 - 40);
    this.score.fill = 'yellow';
    this.score.tweener.moveBy(0, 40, 500, 'easeOutElastic').set({fill:'white'}).play();
    this.setRate(ds);
    this.effect.setPosition(SCREEN_X / 2, SCREEN_Y / 3);
    this.effect.alpha = 1;
    this.effect.tweener.moveBy(0, 40, 400, 'easeOutQuart').fadeOut(150).play();
  },

  setRate: function(ds) {
    if(ds > TIMELIMIT * 3 / 4) {this.effect.text = 'Excellent!!!'; this.effect.fill = 'red'}
    else if(ds > TIMELIMIT * 2 / 4) {this.effect.text = 'Great!!'; this.effect.fill = 'orange'}
    else if(ds > TIMELIMIT * 1 / 4) {this.effect.text = 'Good!'; this.effect.fill = 'yellow'}
    else {this.effect.text = 'OK'; this.effect.fill = 'green'}
    this.effect.text += `\n+${ds}`;
  },
});

// MainScene クラスを定義
phina.define('MainScene', {
  superClass: 'MyDisplayScene',
  init: function() {
    this.superInit();

    // 背景
    this.bg = Shape({
      x: SCREEN_X / 2,
      y: SCREEN_Y / 2,
      width: 1,
      height: SCREEN_Y,
      backgroundColor: 'skyblue'
    }).addChildTo(this);
    this.bg.tweener.to({width: SCREEN_X},3000).play();
    // レイマリの文字
    this.mojis = DisplayElement().addChildTo(this);
    this.mojis.setPosition(0, SCREEN_Y / 3);
    let m = this.mojis;
    (4).times(function(i) {
      Moji(i).addChildTo(m).x = SCREEN_X * (i + 1) / 5;
    });
    this.mojis.isCorrect = function() {
      return this.children.find(e => e.frameIndex != e.correctIndex) == undefined
    };
    // れいむ
    this.reimu = DotCharacter('reimu', 'chara_ss', 32, 40).addChildTo(this);
    this.reimu.gotoAndPlay('stand');
    this.reimu.setPosition(-this.reimu.width, SCREEN_Y * 3 / 4);
    this.reimu.tweener.to({x: SCREEN_X / 4},2000).play();
    // まりさ
    this.marisa = DotCharacter('marisa', 'chara_ss', 32, 40).addChildTo(this);
    this.marisa.gotoAndPlay('stand');
    this.marisa.setPosition(SCREEN_X + this.marisa.width, SCREEN_Y * 3 / 4);
    this.marisa.tweener.to({x: SCREEN_X * 3 / 4},2000).play();
    // Ready Go!とLevel Up!を兼ねているラベル←なんで？
    this.effect = MyLabel({
      text: 'Ready...',
      fontSize: 80,
      fontWeight:'bold',
      fill: 'red',
      stroke: 'black',
    }).addChildTo(this);
    this.effect.setPosition(SCREEN_X / 2, SCREEN_Y / 2);
    this.effect.tweener.to({fontSize: 40, alpha:0},1500).play();
    // 説明文
    this.label = MyLabel({
      text: '↑正しくない文字をタッチ！↑',
      fontSize: 30,
      fill: 'black',
      stroke: 'white',
    }).addChildTo(this);
    this.label.setPosition(SCREEN_X / 2, SCREEN_Y / 2);
    this.label.alpha = 0;

    // ゲーム状態
    this.state = -1;
    this.questioncreator = EasyQcreator(this.mojis);
    this.score = Score().addChildTo(this);

    SoundManager.play('cdown');
  },

  update: function() {
    this.counter += 1;
    switch(this.state) {
      case -1:// initialize
        if(this.counter == 60) {
          this.effect.text = 'Go!!';
          this.effect.fontSize = 80;
          this.effect.alpha = 1;
          this.effect.tweener.to({fontSize: 160, alpha:0},500).play();
        }else if(this.counter >= 90) {
          SoundManager.playMusic('music');
          this.state = 0;
        }
        break;
      case 0:// make question
        this.bg.width = SCREEN_X;
        this.mojis.setPosition(0, SCREEN_Y / 3);
        this.questioncreator.createQuestion();
        this.mojis.children.each(e => e.setInteractive(true));
        if(this.questioncreator.className === 'EasyQcreator') this.label.alpha = 1;
        this.counter = 0;
        this.state = 1;
        break;
      case 1:// choose!
        this.bg.width = SCREEN_X * (TIMELIMIT - this.counter) / TIMELIMIT;
        if(this.mojis.isCorrect()) {
          SoundManager.play('ok');
          this.score.addScore(TIMELIMIT - this.counter + 1);
          this.mojis.children.each(e => e.setInteractive(false));
          this.reimu.gotoAndPlay('jump');
          this.marisa.gotoAndPlay('jump');
          this.bg.tweener.to({width: SCREEN_X},300).play();
          this.label.alpha = 0;
          this.counter = 0;
          this.state = 2;
          if(this.isChangeDifficulty()) this.ChangeDifficulty();
        } else if(this.counter >= TIMELIMIT) {
          SoundManager.play('ng');
          SoundManager.stopMusic('music');
          this.mojis.children.each(e => e.setInteractive(false));
          this.reimu.gotoAndPlay('stare');
          this.marisa.gotoAndPlay('stare');
          this.bg.alpha = 0;
          this.label.alpha = 0;
          this.counter = 0;
          this.state = 3;
        }
        break;
      case 2:// clear!
        this.mojis.x = Random.randint(-15+this.counter, 15-this.counter);
        this.mojis.y = SCREEN_Y / 3 + Random.randint(-15+this.counter, 15-this.counter);
        if(this.counter >= 15) this.state = 0;
        break;
      case 3:// gameover
        if(this.counter >= 20) this.exit({
          mojis: this.mojis,
          score: this.score.getScore(),
        });
        break;
    }
  },

  isChangeDifficulty: function(){
    return (this.score.getScore() > 500 && this.questioncreator.className === 'EasyQcreator'
        ||  this.score.getScore() > 1000 && this.questioncreator.className === 'NormalQcreator')
  },

  ChangeDifficulty: function(){
    if(this.score.getScore() > 1000) this.questioncreator = HardQcreator(this.mojis);
    else                       this.questioncreator = NormalQcreator(this.mojis);

    this.effect = MyLabel({
      text: 'Level Up!!',
      fontSize: 30,
      fontWeight:'bold',
      fill: 'yellow',
      stroke: 'black',
    }).addChildTo(this);
    this.effect.x = SCREEN_X / 2;
    this.effect.y = SCREEN_Y / 2;
    this.effect.tweener.to({fontSize: 50, alpha:0},1500).play();
  },
});

// リザルト
phina.define('ResultScene', {
  superClass: 'MyDisplayScene',
  init: function(param) {
    this.superInit();
    this.mojis = param.mojis;
    this.mojis.setPosition(0, SCREEN_Y / 2);

    this.label1 = MyLabel({
      text: `${param.score}点のレイマリを手に入れた先で`,
      fontSize: 40,
      fill: 'black',
      stroke: 'skyblue',
    }).addChildTo(this);
    this.label1.setPosition(SCREEN_X / 2, SCREEN_Y / 6);

    this.label2 = MyLabel({
      text: '僕が見つけた真実は……',
      fontSize: 40,
      fill: 'black',
      stroke: 'skyblue',
    });
    this.label2.setPosition(SCREEN_X / 2, SCREEN_Y / 4);

    this.tweet = Button({
      text: 'Tweet',
      fontSize: 40,
      fontColor: 'White',
      fill: 'skyblue',
      stroke: 'black',
    });
    this.tweet.setPosition(SCREEN_X * 2 / 3, SCREEN_Y * 3 / 4);
    this.tweet.onpointend = function() {
      let txt = `${param.score}点のレイマリを手に入れた先で\n僕が見つけた真実は……\n\n`;
      let table = 'レイマリアメミルサナモン';
      param.mojis.children.each((e) => {
        txt += table.substr(e.frameIndex, 1) + "　";
      });
      let url = phina.social.Twitter.createURL({
        text: txt + '\n',
        hashtags: 't_is_RM',
      });
      window.open(url, 'share window', 'width=480, height=320');
    };

    this.back = Button({
      text: 'Title',
      fontSize: 40,
      fontColor: 'White',
      fill: 'blue',
      stroke: 'black',
    });
    let self = this;
    this.back.setPosition(SCREEN_X / 3, SCREEN_Y * 3 / 4);
    this.back.onpointend = function() {
      self.exit();
    };
  },

  update: function() {
    if(this.counter >= 60) {
      this.mojis.children.each((e) => {
        e.x = SCREEN_X * (e.correctIndex + 1) / 5 + Random.randint(-6, 6);
        e.y = Random.randint(-6, 6);
      })
      return;
    }
    this.counter += 1;
    if(this.counter == 30){
      this.label2.addChildTo(this);
    }
    else if(this.counter == 60){
      this.mojis.addChildTo(this);
      this.tweet.addChildTo(this);
      this.back.addChildTo(this);
      SoundManager.play('result');
    }
  },
});

// タイトル
phina.define('TitleScene', {
  superClass: 'MyDisplayScene',
  init: function() {
    this.superInit();

    this.label1 = MyLabel({
      text: '僕の見つけた真実は',
      fontSize: 40,
      fill: 'black',
      stroke: 'skyblue',
    }).addChildTo(this);
    this.label1.setPosition(SCREEN_X / 2, SCREEN_Y / 4);
    this.label2 = MyLabel({
      text: '東方Project二次創作\nつくったひと:のとりん',
      fontSize: 30,
      fill: 'black',
      stroke: 'skyblue',
    }).addChildTo(this);
    this.label2.setPosition(SCREEN_X / 2, SCREEN_Y * 8 / 9);

    this.mojis = DisplayElement().addChildTo(this);
    this.mojis.setPosition(0, SCREEN_Y / 2);
    let self = this;
    (4).times(function(i) {
      Moji(i).addChildTo(self.mojis).x = SCREEN_X * (i + 1) / 5;
    });
    this.mojis.tweener.by({y: -20},500,'easeInOutQuad')
                      .by({y: 20},500,'easeInOutQuad')
                      .setLoop(true).play();
    
    this.start = Button({
      text: 'Start',
      fontSize: 40,
      fontColor: 'White',
      fill: 'blue',
      stroke: 'black',
    }).addChildTo(this);
    this.start.setPosition(SCREEN_X / 3, SCREEN_Y * 3 / 4);
    this.start.onpointstart = function(){
      //モバイル端末での音声再生のためにcontextを出し入れする必要があるらしい
      let context = phina.asset.Sound.getAudioContext();
      context.resume();

      self.start.remove();
      self.howto.remove();

      self.label3 = MyLabel({
        text: 'GAME START!!',
        fontSize: 40,
        fontWeight:'bold',
        fill: 'red',
        stroke: 'black',
      }).addChildTo(self);
      self.label3.setPosition(SCREEN_X / 2, SCREEN_Y * 3 / 4);
      self.label3.tweener.fadeOut(150).fadeIn(100).setLoop(true).play();

      self.counter = 1;
      let m = self.mojis.children;
      self.mojis.tweener.clear();
      Array.range(4).each((i)=>{
        let r = Math.degToRad((i - 3) * 40 - 30);
        m.at(i).tweener.by({
          x: Math.cos(r) * 400, y: Math.sin(r) * 400}, 2000, 'easeOutCubic').play();
      })
      SoundManager.play('start');
    }

    this.howto = Button({
      text: 'How To Play',
      fontSize: 30,
      fontColor: 'White',
      fill: 'blue',
      stroke: 'black',
    }).addChildTo(this);
    this.howto.setPosition(SCREEN_X * 2 / 3, SCREEN_Y * 3 / 4);   
    this.howto.onpointstart = function() {
      self.app.pushScene(HowToPlayScene())
    }; 
  },

  update: function() {
    if(this.counter > 0){
      this.counter += 1;
      if(this.counter >= 60) this.exit();
    }
  }
});

phina.define('HowToPlayScene', {
  superClass: 'MyDisplayScene',
  init: function() {
    this.superInit();
    this.backgroundColor = 'rgba(0, 0, 0, 0.7)';

    this.text1 = MyLabel({
      text: 'あそびかた',
      fontSize: 50,
      fill: 'white',
      stroke: 'blue',
    }).addChildTo(this);
    this.text1.setPosition(SCREEN_X / 2, SCREEN_Y / 6); 
    this.text2 = MyLabel({
      text: 'レイマリこそ正義！レイマリ以外は認めん！\n\n'+
            '次々と現れるレイマリっぽい文字列から、\n'+
            '正しくない要素を選び素早くタッチせよ！\n\n'+
            '背景が白に染まりきるとタイムオーバーだ！',
      fontSize: 30,
      fill: 'white',
      stroke: 'blue',
    }).addChildTo(this);
    this.text2.setPosition(SCREEN_X / 2, SCREEN_Y / 2); 
    this.text3 = MyLabel({
      text: '画面タッチで戻る',
      fontSize: 25,
      fill: 'white',
      stroke: 'blue',
    }).addChildTo(this);
    this.text3.setPosition(SCREEN_X / 2, SCREEN_Y * 5 / 6); 

    var self = this;
    this.onpointstart = function() {
      self.exit();
    };
  },
})

// メイン処理
phina.main(function() {
  // アプリケーション生成
  var app = GameApp({
    startLabel: 'title', // メインシーンから開始する
    width: SCREEN_X,
    height: SCREEN_Y,
    assets: ASSETS,
    fps: 30,
  });
  // アプリケーション実行
  app.run();
});
