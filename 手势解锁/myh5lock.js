/**
 * Created by 22935 on 2017/4/29.
 */
/*1.依据半径画圆*/
(function (w) {
  var HandLock=function (options) {//构造器首字母大写
      this.el=options.el||w.document.body;
      this.n= options.n||3;
      this.n= this.n>=2&& this.n<=5?this.n:3;//每行圆的个数
      this.dom={
        message:options.message,
        setPass:options.setPass,
        checkPass:options.checkPass,
        info:options.info
      };
      this.circles=[];//存储n*n个圆
      this.touchCircles=[];//存储已经触摸到的圆
      this.restCircles=[];//存储未触摸到的圆
      this.touchFlag=false;//用于判断是否 touch 到 circle
      this.reDraw=false;//判断是否需要重绘
  };
  HandLock.prototype={
    init:function () {
      this.createCanvas();
      this.createCircles();
      this.initPass();
      this.createListener();
    },
    createCanvas:function () {
      var rect=this.el.getBoundingClientRect(),
       width= rect.width<300?300:rect.width;
      var canvas=document.createElement("canvas");
      this.el.appendChild(canvas);
      canvas.width=canvas.height=width;
      var ctx=canvas.getContext("2d");

      this.canvas=canvas;
      this.ctx=ctx;
      this.width=width;

      /*再创建一个canvas2*/
      var canvas2=canvas.cloneNode(true);
      canvas2.style.position="absolute";
      canvas2.style.left="0";
      canvas2.style.top="0";
      this.el.appendChild(canvas2);
      var ctx2=canvas2.getContext("2d");

      this.canvas2=canvas2;
      this.ctx2=ctx2;
      this.ctx2.strokeStyle = '#ffa726';
    },
    createCircles:function () {
      this.r=Math.floor(this.width/(this.n*4+2));//求半径
      //console.log(this.width/(this.n*4+2));
      r=this.r;//没有var，全局变量；
      /*求所有圆的圆心*/
      for(var i=0;i<this.n;i++)
        for(var j=0;j<this.n;j++){
          var circleCenter={
            x:3*r+4*r*j,
            y:3*r+4*r*i,
            id:3*i+j,
          }
          this.circles.push(circleCenter);
          this.restCircles.push(circleCenter);
        }
      this.drawCircles();
    },

    /*画单个圆*/
    drawCircle:function (x,y,color) {
      this.ctx.strokeStyle=color||'#ffa726';
      this.ctx.lineWidth=2;
      this.ctx.beginPath();
      this.ctx.arc(x,y,this.r,0,Math.PI*2,true);
      this.ctx.closePath();
      this.ctx.stroke();
    },

    /*画出所有圆*/
    drawCircles:function () {
      this.ctx.clearRect(0,0,this.width,this.width);//防止重复画
     /* this.drawCircle(88,88);*/
      var _this=this;
      this.circles.forEach(function (item) {
        /*注意this的不同*/
        _this.drawCircle(item.x,item.y);
      });
    },

    /*密码初始化*/
    initPass:function () {
      this.lsPass=w.localStorage.getItem("HandLock")?{
        model:1,//验证密码
        pass:w.localStorage.getItem("HandLock").split("-"),
      }:{model:2};//设置密码
      this.updateMessage();
    },

   /*监听事件*/
    createListener:function () {
        /*在canvas2上监听事件，原因？*/
        var self=this;//写监听函数时，一定注意内部this的指向
        this.canvas2.addEventListener("touchstart",function(e){

          /*获得触点的相对位置*/
          var p=self.getTouchPos(e);
          self.touchCircles.splice(0);//易犯错误：清空touchCircles数组，如果不清空？？
          /*判断触点是否在圈内*/
          self.judgePos(p);

        },false);

       var t=this.throttle(function (e) {
         var p=this.getTouchPos(e);//获取触摸点位置
         if(this.touchFlag==true){
           this.update(p);
         }else{
           this.judgePos(p);
         }
       },16,16);

        this.canvas2.addEventListener("touchmove",t,false);
        this.canvas2.addEventListener("touchend",function () {
             self.ctx2.clearRect(0,0,this.width,this.width);//解决有多余线出现；
             if(self.touchFlag){
               self.touchFlag=false;
               console.log(this.model);
               self.checkPass();
               self.restCircles=self.restCircles.concat(self.touchCircles.splice(0));/*清空touchCircles数组*/
               setTimeout(function () {
                 self.reset();
               },400)
             }
             //this.model=1;//验证密码


        },false);

        this.dom.setPass.addEventListener("click",function () {//设置密码
          self.lsPass.model=2;
          self.updateMessage();
          self.showInfo("请设置密码",1000);
        });
        this.dom.checkPass.addEventListener("click",function () {//验证密码
          if(self.lsPass.pass){
            self.lsPass.model=1;
            self.updateMessage();
            self.showInfo("验证密码",1000);
          }else{
            self.lsPass.model=2;
            self.updateMessage();
            self.showInfo("请先设置密码",1000);
          }

        });

    },

    reset:function () {//重绘画布
      this.ctx2.clearRect(0,0,this.width,this.width);
      this.drawCircles();
    },
    checkPass:function () {
      /* this.model=2;*///设置密码
      //this.model=3;//确认密码
      var succ;
      switch (this.lsPass.model){
        case 2://设置密码
        {
          /* 密码长度必须大于等于5*/
          if(this.touchCircles.length<5){
            this.showInfo("密码长度必须大于5",1000);//事件监听函数注意this替换
            this.lsPass.model=2;
            this.showInfo("请重新设置密码",1000);
            this.updateMessage();
            succ=false;
          }else{
            //新建临时数组保存设置密码值,和确认密码时比较
            this.lsPass.temp=[];
            for(var i=0;i<this.touchCircles.length;i++){
              this.lsPass.temp.push(this.touchCircles[i].id);
            }
            this.lsPass.model=3;
            this.showInfo("请再次输入密码",1000);
            this.updateMessage();
          }

        };  break;
        case 3://确认密码
        {
          var flag = true;
          if (this.touchCircles.length == this.lsPass.temp.length) {
            for (var i = 0; i < this.touchCircles.length; i++) {
              if (this.touchCircles[i].id != this.lsPass.temp[i]) {
                this.showInfo("第二次密码与第一次不一致", 1000);
                flag = false;
                break;
              }
            }
          } else {
            flag = false;
          }
          if (flag == true) {
            succ=true;
            this.showInfo("密码设置成功", 1000);
            w.localStorage.setItem("HandLock", this.lsPass.temp.join("-")); /*请密码存入localstorage中*/
            this.lsPass.pass = this.lsPass.temp;/*很重要；因为验证密码时，只有第一次初始化从localStorage
            取值，其余从this.lsPass.pass取值，所以必须把新密码赋给它*/
            this.lsPass.model=1;/*密码正确，验证密码*/
            this.updateMessage();
            this.showInfo("请验证密码",1000);

          }else{
            succ=false;
            this.showInfo('两次密码不一致，请重新输入', 1000);
            this.lsPass.model=2;/*由于密码不正确，重新回到 model 2*/
            this.updateMessage();
            this.showInfo("请再次输入密码",1000);
          }
          delete this.lsPass.temp; // 很重要，一定要删掉，bug???不懂
        };  break;
        case 1:/*验证密码*/
        {
            var storPas=this.lsPass.pass,flag=true;
            if(storPas){
              if(this.touchCircles.length == storPas.length){
                for(var i=0;i<this.touchCircles.length;i++){
                  if(this.touchCircles[i].id!= storPas[i]){
                    succ=false;
                    this.showInfo("密码输入错误",1000);
                    flag=false;
                    break;
                  }
                }
              }else{
                 flag=false;
                 succ=false;
                 this.showInfo("密码输入错误",1000);
                 this.lsPass.model=1;
              }
              if(flag==true){
                succ=true;
                this.showInfo("密码正确",1000);
              }
              this.updateMessage();
            }
        }
      }

      if(succ){
        this.drawEndCircles('#2CFF26');// 绿色
      }else{
        this.drawEndCircles('red');// 红色
      }
    },
    drawEndCircles:function (color) {
        for(var i=0;i<this.touchCircles.length;i++){
          this.drawCircle(this.touchCircles[i].x,this.touchCircles[i].y,color);
        }
    },

    update:function (p) {
      /*圆心与触点连线，画实心圆，两个圆连线*/
      this.drawLine2TouchPos(p);
      this.judgePos(p);//必须添加该语句，否则，不能连接两个圆和圆之间连接
      if(this.reDraw==true){
        this.reDraw=false;
        this.drawPoints();
        this.drawLine();
      }
    },
    drawLine:function () {
      /*两个触摸过圆之间连线;两个 canvas，一个在底层，作为描绘静态的圆、点和折线，
      另一个在上层，一方面监听 touchmove 事件，另一方面不停地重绘最后一个密码点的圆心到当前触点之间的线。*/
      var len=this.touchCircles.length;
      if(len>=2){
        this.ctx.beginPath();//注意：在静态canvas上画
        this.ctx.moveTo(this.touchCircles[len-2].x,this.touchCircles[len-2].y);
        this.ctx.lineTo(this.touchCircles[len-1].x,this.touchCircles[len-1].y);//将y写成x,能不能复制过来仔细检查
        this.ctx.closePath();
        this.ctx.stroke();
      }
    },
    drawPoints:function () {//画实心圆
        var len=this.touchCircles.length;//注意：在静态canvas上画,而不是ctx2;
        if(len>=1){
          this.ctx.beginPath();
          this.ctx.fillStyle='#ffa726';
          this.ctx.arc(this.touchCircles[len-1].x,this.touchCircles[len-1].y,r/2,0,Math.PI*2,true);
          this.ctx.closePath();
          this.ctx.fill();
        }

    },
    drawLine2TouchPos:function (p) {//两个点之间连线
       var len=this.touchCircles.length;
       if(len>=1){
         this.ctx2.clearRect(0,0,this.width,this.width);//注意清除画布
         this.ctx2.beginPath();
         this.ctx2.moveTo(this.touchCircles[len-1].x,this.touchCircles[len-1].y);
         this.ctx2.lineTo(p.x,p.y);
         this.ctx2.stroke();
         this.ctx2.closePath();//???
       }
    },

    getTouchPos:function (e) {//获得触摸点的相对坐标
       var parentPos=e.target.getBoundingClientRect();
       var p={
         x:e.touches[0].clientX-parentPos.left,
         y:e.touches[0].clientY-parentPos.top
       }
      return p;
    },

    judgePos:function (p) {/*判断触点是否在圈内*/
      for(var i=0;i<this.restCircles.length;i++){//易犯两点错误：1.数组为restCircles；避免重复添加；
        var temp=this.restCircles[i];//2.为i，不是0
        if(Math.abs(p.x-temp.x)<r&&Math.abs(p.y-temp.y)<r){//??不一定
          this.touchFlag=true;
          this.reDraw=true;
          this.touchCircles.push(temp);
          this.restCircles.splice(i,1);
          console.log(this.touchCircles);
          break;
        }
      }
    },

    /*节流函数*/
    throttle:function (fn,delay,mustRun) {
        var timer=null,startTime=new Date(),self=this;

        /* 修复一个 bug，由于延迟导致的 preventDefault 失效 */
        return function (e) {
          if(e){
            e.preventDefault()?e.preventDefault():null;
            e.stopPropagation()? e.stopPropagation():null;
          }
          var now=new Date(),args=arguments;
          clearTimeout(timer);
          if(mustRun && now-startTime>=mustRun){
             fn.apply(self,args);
             startTime =now;
          }else{
             timer=setTimeout(function () {
               fn.apply(self,args);
             },delay);
          }
        }
    },
    /*显示提示信息*/
    showInfo:function (message,timer) {
      clearTimeout(this.showInfo.timer);
      var info=this.dom.info;
      info.innerHTML=message;
      info.style.display="block";
      this.showInfo.timer=setTimeout(function () {
        info.style.display="";
      },timer||1000);
    },

    /*根据model更新dom*/
    updateMessage:function () {
      if(this.lsPass.model==2){//设置密码
        this.dom.message.innerHTML="请设置手势密码";
        this.dom.setPass.checked="true";
      }
      if(this.lsPass.model==1){//验证密码
        this.dom.message.innerHTML="请验证手势密码";
        this.dom.checkPass.checked="true";
      }
      if(this.lsPass.model==3){//确认输入密码
        this.dom.message.innerHTML="请再次输入密码";
        this.dom.setPass.checked="true";
      }

    },
  }//原型结束
  window.HandLock=HandLock;
})(window);



