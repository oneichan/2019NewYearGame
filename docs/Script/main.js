// phina.js をグローバル領域に展開
phina.globalize();

//定数
var FRAME_SIZE = 32;
var ANIMATION_FREQUENCY = 3;


//アセット
var ASSETS = {
  //画像
  image:{
    'uribo':'./Resource/uribo_running.png',
  },

  //スプライトシート
  spritesheet:{
    'uribo_ss': 
    {
      'frame': {
        'width': FRAME_SIZE,
        'height': FRAME_SIZE,
        'cols': 3,
        'rows': 1,
      },

      'animations': {
        'running': {
          'frames': [0,1,2],
          'next': 'running',
          'frequency': ANIMATION_FREQUENCY,

        },
      }
    },
  }
};

//ドット絵」表示をきれいにする
phina.define('PixelSprite', {
  superClass: 'Sprite',

  init: function(image, width, height){
    this.superInit(image, width, height);
  },
  draw: function(canvas){
    canvas.save();                        //canvasの状態をスタックに保存
    canvas.imageSmoothingEnabled = false; //拡大時の補完を無効にする

    this.superMethod('draw', canvas);     //Spriteのdrawメソッド呼び出し

    canvas.restore();                     //他に影響が出ないように状態を戻す
  },
});


// MainScene クラスを定義
phina.define('MainScene', {
  superClass: 'DisplayScene',
  init: function() {
    this.superInit();
    // 背景色を指定
    this.backgroundColor = '#444';

    var uriboSprite = PixelSprite('uribo',FRAME_SIZE,FRAME_SIZE).addChildTo(this);
    var anim = FrameAnimation('uribo_ss').attachTo(uriboSprite);
    anim.gotoAndPlay('running');

    uriboSprite.x = this.gridX.center();
    uriboSprite.y = this.gridY.center();
    uriboSprite.setScale(4,4);
   
  },
});

// メイン処理
phina.main(function() {
  // アプリケーション生成
  var app = GameApp({
    startLabel: 'main', // メインシーンから開始する
    assets: ASSETS,
  });
  // アプリケーション実行
  app.run();
});
