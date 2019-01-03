// phina.js をグローバル領域に展開
phina.globalize();

//定数
var SCREEN_WIDTH = 1024;
var SCREEN_HEIGHT = 576;
var FRAME_SIZE = 32;
var MAPCHIP_SIZE  = 16;
var SPRITE_SCALE = 4;
var ANIMATION_FREQUENCY = 3;
var GRID_Y_GROUND = 6.5;
var RESOURCE_FOLDER_PATH = './Resource/';
var TIME_COUNTDOWN = 3 * 1000;
var PLAYER_SPEED = 10;
var JUMP_POWER = 10;
var JUMP_MAX_HEIGHT = MAPCHIP_SIZE * SPRITE_SCALE * (GRID_Y_GROUND - 2);
var JUMP_STAY_DISTANCE = 30;
var GROUND_HEIGHT = MAPCHIP_SIZE * SPRITE_SCALE * (GRID_Y_GROUND);
var GRAVITY = 0.5;
var MAP_GRID_X;
var MAP_GRID_Y;

var COLLISION_SCALE = 3;

var uriboSprite;

//マップチップ番号定義
var MapChipID = {
  None: 0,
  Ground: 1,
  Goal: 2,
  Trap: 3,
  Coin: 4,
};

function StateStruct(current,previous){
  this.current = current;
  this.previous = previous;
};

var GameState = {
  Start: 0,
  GamePlay: 1,
  Goal: 2,
  GameOver: 3,
  None: 4,
};
var gameState = new StateStruct(GameState.Start,GameState.None);

var PlayerState = {
  Running: 0,
  Jump_Up: 1,
  Jump_down: 2,
  Damage: 3,
  Stay: 4,
  Goal: 5,
  None: 6,
  Jump_Stay: 7,
};
var playerState = new StateStruct(PlayerState.Stay,PlayerState.None);

var mapDataArray = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,3,0,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

//アセット
var ASSETS = {
  //画像
  image:{
    uribo: RESOURCE_FOLDER_PATH + 'uribo.png',
    ground:RESOURCE_FOLDER_PATH + 'Ground.png',
    trap:RESOURCE_FOLDER_PATH + 'Trap1.png',
    goal: RESOURCE_FOLDER_PATH + 'goal.png'
  },

  //スプライトシート
  spritesheet:{
    uribo_ss: 
    {
      frame: {
        width: FRAME_SIZE,
        height: FRAME_SIZE,
        cols: 3,
        rows: 2,
      },

      animations: {
        running: {
          frames: [0,1,2],
          next: 'running',
          frequency: ANIMATION_FREQUENCY,
        },
        stay: {
          frames:[1],
          next:'stay',
          frequency: ANIMATION_FREQUENCY,
        },
        jump_up: {
          frames:[0],
          next:'jump_up',
          frequency: ANIMATION_FREQUENCY,
        },
        jump_down: {
          frames:[0],
          next:'jump_down',
          frequency: ANIMATION_FREQUENCY,
        },
        tenmetu:{
          frames:[3,4],
          next:'tenmetu',
          frequency: 4,
        }
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
  var mapArray = [];
  var req = new XMLHttpRequest();

  //req.open('GET',path,true);
  req.open('GET',path,false);

  req.send(null);

  //req.onload = function(){
    var csvData = req.responseText;
    var lines = csvData.split('\n');
    lines.length.times(function(height){
      var words = lines[height].split(',');
      mapArray[height] = [];
      words.length.times(function(width){
        mapArray[height][width] = words[width];
      });
    });
    return mapArray;
  //};

  //return arrayData;

};

//------------------------------------------------------------------------------------------

//プレイヤークラス
phina.define('Player',{
  superClass: 'PixelSprite',
  init: function(){
    this.superInit('uribo',32,16);
    this.setOrigin(0.5,0.5);

    // 向きを反転する
    this.scaleX *= -1;

    //アニメーション    
    this.anim = FrameAnimation('uribo_ss').attachTo(this);

    //滞空時間計算用
    this.jumpDistance = 0;

    //アニメーション回数数える
    this.damageAnimTime =0;

  },
  update: function(app){

    var self = this;
    
    if(playerState.current != playerState.previous){
      //ステート変更後初期処理
      initState(playerState.current);
      playerState.previous = playerState.current;
    }else{
      updateState(playerState.current);
    }

    function initState(state){
      switch(state){
        case PlayerState.Stay:
          self.anim.gotoAndPlay('stay');
          //self.setInteractive(false);//タッチ不可
          break;
        case PlayerState.Running:
          self.anim.gotoAndPlay('running');
          
          //self.bottom = 
          break;
        case PlayerState.Jump_Up:
          self.anim.gotoAndPlay('jump_up');
          break;
        case PlayerState.Jump_down:
          self.anim.gotoAndPlay('jump_down');

          break;
        case PlayerState.Damage:
          self.anim.gotoAndPlay('tenmetu');
          break;
        case PlayerState.Goal:
          break;
      }
    };

    function updateState(state){
      switch(state){
        case PlayerState.Stay:
          //this.anim.gotoAndPlay('stay');
          break;
        case PlayerState.Running:
          //this.anim.gotoAndPlay('running');
          break;
        case PlayerState.Jump_Up:
          if(self.y <= JUMP_MAX_HEIGHT){
            //最高点まで来たら待機
            playerState.current = PlayerState.Jump_Stay;
            return;
          }
          self.y -= calcJumpPower();
          break;
        case PlayerState.Jump_Stay:
          self.jumpDistance += PLAYER_SPEED;
          if(self.jumpDistance >= JUMP_STAY_DISTANCE){
            self.jumpDistance = 0;
            playerState.current = PlayerState.Jump_down;
            return;
          }
          break;
        case PlayerState.Jump_down:
          if(self.y >= GROUND_HEIGHT){
            //地面についたら走る
            self.y = GROUND_HEIGHT;
            playerState.current = PlayerState.Running;
            return;
          }
          self.y += calcJumpPower();
          break;
        case PlayerState.Damage:
          self.damageAnimTime += app.deltaTime;
          if(self.damageAnimTime >= 2000){
            self.damageAnimTime = 0;
            playerState.current = PlayerState.Running;
            return;
          }
          
          break;
        case PlayerState.Goal:
          break;
      }  
    };

    function calcJumpPower(){
      var pow = Math.abs(JUMP_MAX_HEIGHT - self.y) / Math.abs(JUMP_MAX_HEIGHT - GROUND_HEIGHT);
      return (JUMP_POWER) + JUMP_POWER * pow;
    }

  },

});

//地面クラス
phina.define('Ground',{
  superClass:'PixelSprite',
  init: function(){
    this.superInit('ground',16,16);
    this.setOrigin(0.5,0.5);

  },
});

//おうちクラス
phina.define('Goal',{
  superClass:'PixelSprite',
  init: function(){
    this.superInit('goal',32,32);
    this.setOrigin(0.5,0.75);

  },
});

//罠クラス
phina.define('Trap',{
  superClass:'PixelSprite',
  init: function(){
    this.superInit('trap',16,16);
    this.setOrigin(0.5,0.5);

  },

  // update: function(){
  //   if(uriboSprite.hitTestElement(this)){
  //     alert('Damage!!!!');
  //   }
  // },
});

// MainScene クラスを定義
phina.define('MainScene', {
  superClass: 'DisplayScene',
  init: function(option) {
    this.superInit(option);
    // 背景色を指定
    this.backgroundColor = '#fff';

    //ラベル
    label = Label({
      text: '',
      fontSize: 48,
      x: this.gridX.center(),
      y: this.gridY.center(),
    }).addChildTo(this);

    //MAP描画
    //var maparray = CSVtoMapArray(RESOURCE_FOLDER_PATH + 'map.csv');
    var maparray = mapDataArray;
    this.mapDisplay = DisplayElement().addChildTo(this);
    this.hitItemArray =[];
    createMap(this.mapDisplay,this.hitItemArray);
    var time = 0;
    this.mapDisplay.update = function(app){
      switch(gameState.current){
        case GameState.Start:
          time += app.deltaTime;
          if(time >= TIME_COUNTDOWN){
            label.text = 'GO!';
            gameState.current = GameState.GamePlay;
            playerState.current = PlayerState.Running;
          }else{
            label.text = 'READY…';
          }
          break;
        case GameState.GamePlay:
          //程よいところでラベル消す
          if(this.x < -100){
            label.text = ''
          }
          if(playerState.current != PlayerState.Damage){
            this.x -= PLAYER_SPEED; 
          }else{
            this.x -= PLAYER_SPEED * 0.3; 
          }
          break;
        case GameState.GameOver:
          break;
        case GameState.Goal:
          break;
      }
    };
  
     //プレイヤー追加
     uriboSprite = Player().addChildTo(this);
     uriboSprite.x = MAP_GRID_X.span(1);
     uriboSprite.y = MAP_GRID_Y.span(GRID_Y_GROUND);
    
    //グリッドのマス数入れるとWidthを計算する
    function getGridSize(cellCount){
      var returnObj ={
        width: MAPCHIP_SIZE * SPRITE_SCALE * cellCount,
        columns: cellCount,
      }    
      return returnObj;
    };

    //マップ作成する
    function createMap(displayElement,hitItemArray){
      var gridSizeX = maparray[0].length;
      var gridSizeY = maparray.length;
      MAP_GRID_X = Grid(getGridSize(gridSizeX));
      MAP_GRID_Y = Grid(getGridSize(gridSizeY));
      gridSizeY.times(function(spanY){
        gridSizeX.times(function(spanX){
          var mapchip;
          var mapchipid = maparray[spanY][spanX];
  
          switch(mapchipid){
            case MapChipID.Trap:
              mapchip = Trap();
              mapchip.addChildTo(displayElement);
              hitItemArray.push(mapchip);
              mapchip.setPosition(MAP_GRID_X.span(spanX),MAP_GRID_Y.span(spanY));      
              break;
            case MapChipID.Ground:
              mapchip = Ground();
              mapchip.addChildTo(displayElement);
              mapchip.setPosition(MAP_GRID_X.span(spanX),MAP_GRID_Y.span(spanY));
              break;   
            case MapChipID.Goal:
            mapchip = Goal();
            mapchip.addChildTo(displayElement);
            mapchip.setPosition(MAP_GRID_X.span(spanX),MAP_GRID_Y.span(spanY));
            break;   
        }
        });
      });
    };
   
  },
  onpointstart: function(){
    if(playerState.current === PlayerState.Running){
      playerState.current = PlayerState.Jump_Up;
    }
  },
 
  update: function(){

    var self = this;

    if(gameState.current != gameState.previous){
      //ステート変更後初期処理
      initState(gameState.current);
      gameState.previous = gameState.current;
    }else{
      updateState(gameState.current);
    }

    function initState(state){
      switch(state){
        case GameState.Start:
          self.setInteractive(false);
          break;
        case GameState.GamePlay:
          if(playerState.current != PlayerState.Running){
            self.setInteractive(false);
          }else{
            self.setInteractive(true);
          }
          break;
        case GameState.GameOver:
          break;
        case GameState.Goal:
          break;
      }
    };

    function updateState(state){
      switch(state){
        case GameState.Start:        
          break;
        case GameState.GamePlay:
          if(playerState.current === PlayerState.Damage){
            
            return;
          }       
          self.hitItemArray.forEach(function(hitItem){
            // var playerCol1 = CircleShape(uriboSprite.x - (FRAME_SIZE * SPRITE_SCALE / 4),uriboSprite.y + uriboSprite.y/16,uriboSprite.radius)
            // .addChildTo(self)
            // .setPosition(uriboSprite.x - (FRAME_SIZE * SPRITE_SCALE / 4),uriboSprite.y + uriboSprite.y/16);
            //.alpha = 0.1;
            //playerCol1.backgroundColor ='red';
            // var playerCol2 = CircleShape(uriboSprite.x + (FRAME_SIZE * SPRITE_SCALE / 4),uriboSprite.y,uriboSprite.radius)
            // .addChildTo(self)
            // .setPosition(uriboSprite.x + (FRAME_SIZE * SPRITE_SCALE / 4),uriboSprite.y + uriboSprite.y/16);
            //.alpha = 0.1;

            // var rect = RectangleShape(hitItem.x + self.mapDisplay.x,hitItem.y,
            //                 hitItem.width * COLLISION_SCALE,hitItem.height* COLLISION_SCALE)
            //                 .addChildTo(self)
            //                 .setPosition(hitItem.x + self.mapDisplay.x,hitItem.y);
                            //.alpha = 0.1;
            var playerCol1 = Circle(uriboSprite.x - (FRAME_SIZE * SPRITE_SCALE / 4),uriboSprite.y + uriboSprite.y/16,uriboSprite.radius);
            var playerCol2 = Circle(uriboSprite.x + (FRAME_SIZE * SPRITE_SCALE / 2),uriboSprite.y + uriboSprite.y/16,uriboSprite.radius)
            var rect = Rect(hitItem.x + self.mapDisplay.x,hitItem.y, hitItem.width * COLLISION_SCALE,hitItem.height* COLLISION_SCALE);
            if(Collision.testCircleRect(playerCol1,rect) || Collision.testCircleRect(playerCol2,rect) ){
              playerState.current = PlayerState.Damage;
            }
          });

          break;
        case GameState.GameOver:
          break;
        case GameState.Goal:
          break;
      }
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
