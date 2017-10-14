
var imageCropper = {
    
    canvas: null,

    ctx: null,
    
    tempCanvas: null,
    
    tempCtx: null,

    image: null,

    pastedData: null,//url картинку який вставляємо
    
    pastedImage: null,//дані про локальну картинку
    
    click: false,//для визначення затиснутого кліку

    downPointX: 0,

    downPointY: 0,

    lastPointX: 0,

    lastPointY: 0,
    
    
    el: function(id){
        return document.getElementById(id);
    },
    
    
    init: function(){
        
        this.canvas = this.el('main_canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.defaults();//дефолтні значення інпутів
        
        this.el('button_like_input_file').addEventListener('click', function(){
            this.el('input_file').click();//створюєм цю функцію для того щоб не відображався шлях до файлу біля input type=file. тобто умулюємо клік на цей інпут через просту кнопку
        }.bind(this));
        
        this.el('input_file').addEventListener('change', this.checkIfImage.bind(this), false);//перевіряємо чи файл є картинкою
        
        this.el('fetch_image_url').addEventListener('click', this.isValidURL.bind(this), false);//перевіряємо вставляємий url
        
        this.el('crop_mode_check').disabled = true;
        
    },
    
    
    defaults: function(){
        
        var image_path = document.getElementsByClassName('image_path')[0];
        var image_path_remote = document.getElementsByClassName('image_path_remote')[0];
        
        document.myForm.radio_check[0].onchange = function(){
            image_path_remote.style.visibility = 'hidden';
            image_path.style.visibility = 'visible';
        }
        
        document.myForm.radio_check[1].onchange = function(){
            image_path.style.visibility = 'hidden';
            image_path_remote.style.visibility = 'visible';
        }
        
        this.el('image_path_input').value = '';
        
        window.onbeforeunload = function(){//перед перезавантаженням сторінки обнулити значення радіокнопок
            this.el('crop_mode_check').checked = false;
            document.myForm.radio_check[0].checked = false;
            document.myForm.radio_check[1].checked = false;
        }.bind(this);
         
    },
    
    
    checkIfImage: function(){
        
        this.pastedImage = this.el('input_file').files[0];
        
        this.el('image_path_input').value = this.el('input_file').value;
        
        (this.pastedImage.name.match(/.(jpg|jpeg|png|gif)$/i)) ? (this.readImage()) : (alert('please make sure to upload an image'))//якщо картинка то зчитуєм її. якщо ні - повідомляємо що зчитати не можем
        
    },
    
    
    isValidURL: function(){
        
        var RegExp = /(?:http|https):\/\/((?:[\w-]+)(?:\.[\w-]+)+)(?:[\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?/;
        
        this.pastedData = this.el('image_path_remote').value;
        
        (RegExp.test(this.pastedData)) ? (this.readImage()) : (alert('make sure your url is valid'))//якщо url дійсний тоді зчитуєм зображення якщо ні - повідомляєм що url недійсний
        
    },
    
    
    readImage: function(){
        
        var fr = new FileReader();
        fr.onload = function(e) {
            this.image = new Image();
            this.image.crossOrigin = '';//саме через це значення не хотіло зберігати ремоут картинки в усіх браузерах. тому це корисна штука. ми дозволяємо крос-доменні запити
            
            this.image.src = (document.myForm.radio_check[0].checked ? (e.target.result) : (this.pastedData));//присвоюєм ту чи іншу адресу картинки
            
            this.onImageLoad();//при загрузці картинки робимо деякі зміни у вюшці
            
            this.canvas.width = this.image.width;
            this.canvas.height = this.image.height;
            this.reDrawCanvas();//перемальовуєм виділення
            this.initEventsOnCanvas();//додаєм обробники подій
        }.bind(this);
        
        
        var fileAsURL = new Blob([this.pastedData], {type: 'file'});//створюємо інстанс типу Blob для того щоб FileReader міг прочитати ремоут картинку як файл

        if(document.myForm.radio_check[0].checked){
            fr.readAsDataURL( this.pastedImage );
        }else{
            fr.readAsDataURL( fileAsURL );
        }
        
    },
    
    
    onImageLoad: function(){
        
        this.ctx.drawImage(this.image, 0, 0);
        this.el('crop_mode_check').checked = true;
        this.el('crop_mode_check').disabled = true;
        this.el('main_canvas').style.cursor = 'crosshair';
        this.el('crop_mode').style.width = this.image.width + 'px';
        
    },
    
    
    initEventsOnCanvas: function() {
        this.ctx.canvas.onmousedown = this.onMouseDown.bind(this);
        this.ctx.canvas.onmouseup = this.onMouseUp.bind(this);
    },
    
    
    onMouseDown: function(e) {
        e.preventDefault();
        var loc = this.windowToCanvas(e.clientX, e.clientY);//приводимо координати html документа до координат канвасу
        this.click = true;
        this.ctx.canvas.onmousemove = this.onMouseMove.bind(this);
        this.downPointX = loc.x;
        this.downPointY = loc.y;
        this.lastPointX = loc.x;
        this.lastPointY = loc.y;
    },


    //функція яка перетворює html координати в координати канвасу
    windowToCanvas: function(x, y) {
        var canvas = this.ctx.canvas;
        var tempbox = canvas.getBoundingClientRect();

        return {
            x: x - tempbox.left * (canvas.width / tempbox.width),
            y: y - tempbox.top * (canvas.height / tempbox.height)
        };
    },

    
    //при русі мишки і затиснутому кліку змінюємо виділення
    onMouseMove: function(e) {
        e.preventDefault();
        if (this.click) {
            var loc = this.windowToCanvas(e.clientX, e.clientY);
            this.lastPointX = loc.x;
            this.lastPointY = loc.y;
            this.reDrawCanvas();
        }
    },

    
    onMouseUp: function(e) {
        e.preventDefault();
        this.click = false;
        this.cropImage();
    },

    
    reDrawCanvas: function() {
        this.clearCanvas();
        this.drawImage();
        this.drawSelRect();
    },

    
    clearCanvas: function() {
        this.ctx.clearRect(0, 0, this.ctx.width, this.ctx.height);
    },

    
    drawImage: function() {
        this.ctx.drawImage(this.image, 0, 0);
    },

    //малюєм рамку виділення на канвасі
    drawSelRect: function() {
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 15]);
        this.ctx.strokeRect(this.downPointX, this.downPointY, (this.lastPointX - this.downPointX), (this.lastPointY - this.downPointY));
    },


    //при відпусканні мишки запускаємо цю функцію яка створює новий канвас і малює в ньому виділену картинку. Також додоаєо обробники подій на кнопки
    cropImage: function() {
        
        this.tempCanvas = this.el('popup_canvas');
        this.tempCtx = this.el('popup_canvas').getContext('2d');
        this.tempCtx.canvas.width = (this.lastPointX - this.downPointX);
        this.tempCtx.canvas.height = (this.lastPointY - this.downPointY);
        
        this.tempCtx.drawImage(this.image, this.downPointX, this.downPointY, (this.lastPointX - this.downPointX), (this.lastPointY - this.downPointY), 0, 0, (this.lastPointX - this.downPointX), (this.lastPointY - this.downPointY));
        
        this.makePopup();//визначаємо розміри попапу і робим його видимим. Також в ньому присутня анімація
        
        this.el('btn_cancel').addEventListener('click', this.closeModal.bind(this), false);
        
        this.el('btn_save_as').addEventListener('click', this.saveCroppedImage.bind(this), false);
        
        this.el('btn_replace').addEventListener('click', this.replaceMainImage.bind(this), false);
        
    },
    
    
    makePopup: function(){
        
        var modal_content = document.getElementsByClassName('modal-content')[0];
        modal_content.style.width = (((this.lastPointX - this.downPointX) > 250) ? (this.lastPointX - this.downPointX) : 250) + 'px';
        modal_content.style.height = (this.lastPointY - this.downPointY) + 50 + 'px';
        this.el('myModal').style.display = 'block';
        
    },
    
    
    closeModal: function(){
        this.el('myModal').style.display = "none";
    },
    
    //при заміні канвасу вирізану картинку ставимо на головний канвас
    replaceMainImage: function(){
        
        this.ctx.clearRect(0, 0, this.el('main_canvas').width, this.el('main_canvas').height);

        this.canvas.width = (this.lastPointX - this.downPointX);
        this.canvas.height = (this.lastPointY - this.downPointY);

        this.ctx.drawImage(this.image, this.downPointX, this.downPointY, (this.lastPointX - this.downPointX), (this.lastPointY - this.downPointY), 0, 0, (this.lastPointX - this.downPointX), (this.lastPointY - this.downPointY));
        this.el('crop_mode').style.width = this.canvas.width + 'px';
        this.el('btn_cancel').click();
        
    },
    
    //зберігаємо картинку
    saveCroppedImage: function(){
        this.el('btn_save_as').href = this.tempCanvas.toDataURL();
        this.el('btn_save_as').download = 'myCroppedImage.png';
    }
     
}

//запускаємо функцію з якої буде починатися весь код
imageCropper.init();


