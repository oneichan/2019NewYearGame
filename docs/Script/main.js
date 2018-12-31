// phina.js をグローバル領域に展開
phina.globalize();

//定数
var SCREEN_WIDTH = 1024;
var SCREEN_HEIGHT = 576;

var FRAME_SIZE = 32;
var MAPCHIP_SIZE  = 16;
var SPRITE_SCALE = 4;
var ANIMATION_FREQUENCY = 3;

var GRID_Y_GROUND = 8;

var RESOURCE_FOLDER_PATH = './Resource/';

//マップチップ番号定義
var MapChipID = {
  None: 0,
  Ground: 1,
  Goal: 2,
  Trap: 3,
  Coin: 4,
};

var mapDataArray = [
  [0,0,0,0,0,0],
  [0,0,0,0,0,0],
  [0,0,0,0,0,0],
  [0,0,0,3,3,0],
  [1,1,1,1,1,1],
];

//アセット
var ASSETS = {
  //画像
  image:{
    uribo: RESOURCE_FOLDER_PATH + 'uribo_running.png',
    ground:RESOURCE_FOLDER_PATH + 'Ground.png',
    trap:RESOURCE_FOLDER_PATH + 'Trap1.png',
  },

  //スプライトシート
  spritesheet:{
    uribo_ss: 
    {
      frame: {
        width: FRAME_SIZE,
        height: FRAME_SIZE,
        cols: 3,
        rows: 1,
      },

      animations: {
        running: {
          frames: [0,1,2],
          next: 'running',
          frequency: ANIMATION_FREQUENCY,

        },
      }
    },
  }
};

//汎用クラス------------------------------------------------------------------------------------------

//ドット絵表示をきれいにする
phina.define('PixelSprite', {
  superClass: 'Sprite',

  init: function(image,width,height){
    this.superInit(image, width, height);
    this.setScale(SPRITE_SCALE);

  },
  draw: function(canvas){
    canvas.save();                        //canvasの状態をスタックに保存
    canvas.imageSmoothingEnabled = false; //拡大時の補完を無効にする

    this.superMethod('draw', canvas);     //Spriteのdrawメソッド呼び出し

    canvas.restore();                     //他に影響が出ないように状態を戻す
  },
});

//csv読み込み
function CSVtoMapArray(path){
  var arrayData = [];
  var req = new XMLHttpRequest();

  req.open('GET',path,true);
  req.send(null);

  req.onload = function(){
    var csvData = req.responseText;
    var lines = csvData.split('\n');
    lines.length.times(function(height){
      var words = lines.split(',');
      arrayData[height] = [];
      words.length.times(function(width){
        arrayData[height][width];
      });
    });
  }

  return arrayData;

};

//------------------------------------------------------------------------------------------

//プレイヤークラス
phina.define('Player',{
  superClass: 'PixelSprite',
  init: function(){
    this.superInit('uribo',32,32);
    
    // 向きを反転する
    this.scaleX *= -1;

    //アニメーション
    var anim = FrameAnimation('uribo_ss').attachTo(this);
    anim.gotoAndPlay('running');

  },

});

//地面クラス
phina.define('Ground',{
  superClass:'PixelSprite',
  init: function(){
    this.superInit('ground',16,16);
    this.setOrigin(0,0);

  },
});

//罠クラス
phina.define('Trap',{
  superClass:'PixelSprite',
  init: function(){
    this.superInit('trap',16,16);
    this.setOrigin(0,0);

  },
});

// MainScene クラスを定義
phina.define('MainScene', {
  superClass: 'DisplayScene',
  init: function(option) {
    this.superInit(option);
    // 背景色を指定
    this.backgroundColor = '#fff';

    //MAP描画
    mapDataArray = CSVtoMapArray(RESOURCE_FOLDER_PATH + 'map_stage.csv');
    var mapDisplay = DisplayElement().addChildTo(this);
    var mapGridX = Grid(getGridSize(6));
    var mapGridY = Grid(getGridSize(5));
    mapDataArray.length.times(function(spanY){
      mapDataArray[spanY].length.times(function(spanX){
        var mapchip;
        var mapchipid = mapDataArray[spanY][spanX];

        switch(mapchipid){
          case MapChipID.Trap:
            mapchip = Trap();
            mapchip.addChildTo(mapDisplay);
            mapchip.setPosition(mapGridX.span(spanX),mapGridY.span(spanY));      
            break;
          case MapChipID.Ground:
            mapchip = Ground();
            mapchip.addChildTo(mapDisplay);
            mapchip.setPosition(mapGridX.span(spanX),mapGridY.span(spanY));      
        }
      });
    });

     //プレイヤー追加
     var uriboSprite = Player().addChildTo(this);
     uriboSprite.x = mapGridX.center();
     uriboSprite.y = mapGridY.span(GRID_Y_GROUND - 1);
    
    //グリッドのマス数入れるとWidthを計算する
    function getGridSize(cellCount){
      var returnObj ={
        width: MAPCHIP_SIZE * SPRITE_SCALE * cellCount,
        columns: cellCount,
      }    
      return returnObj;
    };
   
  },

  //グリッドのマス数入れるとWidthを計算する
  // getGridSize: function(cellCount){
  //   var width = MAPCHIP_SIZE * SPRITE_SCALE * cellCount;
  //   var columns = cellCount;
  //   return [width,columns];
  // },

});

// メイン処理
phina.main(function() {
  // アプリケーション生成
  var app = GameApp({
    startLabel: 'main', // メインシーンから開始する

    //画面サイズ
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    //fit: false,

    assets: ASSETS,
  });
  // アプリケーション実行
  app.run();
});
