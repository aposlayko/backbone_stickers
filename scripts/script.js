window.onload = function() {

    var Sticker = Backbone.Model.extend({
            defaults: {
                content: "undefined",
                coords: {'top': 0, 'left': 0}
            }
        }),

        StickerCollection = Backbone.Collection.extend({
            model: Sticker,
            initialize: function() {
//                this.add(new Sticker({'content': 'cash a check'}));
//                this.add(new Sticker({'content': 'buy a christmas tree'}));
//                this.add(new Sticker({'content': 'go to the hospital'}));
//                this.add(new Sticker({'content': 'return the book', coords:{'top': 100, 'left': 100}}));
//                this.add(new Sticker({'content': 'buy napalm'}));
//                this.add(new Sticker({'content': 'capture the world'}));
            }
        }),

        StickerView = Backbone.View.extend({
            tagName: 'div',
            className: "sticker-abs",
            in_container: true,
            template: _.template('<%= content %><br/>top: <%= coords.top%> left: <%= coords.left%>'),
            initialize: function() {
                this.sticker_edit_form = new StickerEditView();
				this.model.on('change', this.render, this);
                this.render();
            },
            events: {'contextmenu': 'deleteSticker',
                     'dblclick': 'editStickerForm',
                     'mousedown': 'drag'},
            render: function() {

                this.$el.css({"left": this.model.get('coords').left+"px",
                                "top": this.model.get('coords').top+"px"});
                this.$el.html(this.template(this.model.toJSON()));
                return this;
            },
            deleteSticker: function(event) {
                event.preventDefault();
                event.stopPropagation();
                this.model.destroy();
                this.remove();
                console.log('destroy');
            },
            editStickerForm: function(event) {
                event.stopPropagation();
                event = fixEvent(event);
                this.sticker_edit_form.model = this.model;
                this.sticker_edit_form.coords = {top: event.pageY, left: event.pageX};
                this.sticker_edit_form.render();
                console.log('dbclick on sticker');
            },
            drag: function(event) {
                event.stopPropagation();

                var self = this.el,
                    view = this,
                //нормализированный объект события
                    e = fixEvent(event),
                //координаты элемента
                    coords = getCoords(this.el),
                //позиционирование мышки на элементе
                    shiftX = e.pageX - coords.left,
                    shiftY = e.pageY - coords.top;

                opasity(self, {start: 1, end: 0.6, time: 100});
                document.body.appendChild(this.el);
                moveAt(e);
                //this.el.style.zIndex = 1000;

                function moveAt(e) {
                    //изменяем значения модели, а по событию "change" она сама перерисовывется
                    view.model.set('coords', {top: e.pageY - shiftY,
                                            left: e.pageX - shiftX});
                }
                document.onmousemove = function(e) {
                    var in_cont = view.isOutOfContainer(e);
                    e = fixEvent(e);
                    moveAt(e);
                    if(in_cont !== view.in_container) {
                        view.in_container = in_cont;
                        view.$el.toggleClass('out');
                    }
                };

                //drop
                this.el.onmouseup = function() {
                    var destroy = function() {
                        view.model.destroy();
                        view.remove();
                    };
                    if(!view.in_container) {
                        opasity(self, {start: 0.6, end: 0, time: 800}, destroy);
                    } else {
                        opasity(self, {start: 0.6, end: 1, time: 100});
                    }
                    document.onmousemove = self.onmouseup = null;
                };
            },
            isOutOfContainer: function(e) {
                var result = false,
                    cont_borders = this.model.get('container_size'),
                    pos_x = e.pageX,
                    pos_y = e.pageY;
                //console.log(cont_borders, pos_x, pos_y);
                if((pos_x >= cont_borders.left && pos_x <= cont_borders.right) &&
                    (pos_y >= cont_borders.top && pos_y <= cont_borders.bottom)) {
                    result = true;
                } else {
                    result = false;
                }
                return result;
            }
        }),

        StickerEditView = Backbone.View.extend({
            template: _.template($("#form-template").html()),
            el: $("#edit-form"),
            events: {
                //"click #submit": "submitChanges"
            },
            submitChanges: function() {
                this.model.set('content', this.$el.find('#content').val());
                this.$el.html("");
            },
            cancelChanges: function() {
                this.$el.html(""); //зачищает форму
            },
            render: function() {
                this.$el.css({"left": this.coords.left + "px",
                                "top": this.coords.top + "px"});

                this.$el.html(this.template(this.model.toJSON())); //отображение с шаблона
                //вставка прошлого значения в поле формы
                this.$el.find('#content').val(this.model.get('content'));
                //навешивание своих событий
                this.$el.find('#cancel').on('click', function(obj) {
                    return function() {
                        obj.cancelChanges();
                    };
                }(this));
                this.$el.find('#submit').on('click', function(obj) {
                    return function() {
                        obj.submitChanges();
                    };
                }(this));
                return this;
            }
        }),

        StickerAddView = Backbone.View.extend({
            template: _.template($('#form-newsticker-template').html()),
            el: $('#new-sticker-form'),
            events: {
                "click #add_cancel": "cancelChanges",
                "click #add_submit": "submitChanges"
            },
            cancelChanges: function() {
                this.$el.html("");
            },
            submitChanges: function() {
                this.collection_view.addStickerToCollection(this.$el.find('#add_content').val(), this.coords);
                this.$el.html("");
            },
            render: function() {
                this.$el.css({"left": this.coords.left + "px",
                            "top": this.coords.top + "px"});
                this.$el.html(this.template());
				return this;
            }
        }),

        StickerCollectionView = Backbone.View.extend({
            initialize: function() {
                this.collection = new StickerCollection();
                this.sticker_add_form = new StickerAddView();
                this.sticker_add_form.collection_view = this;
				this.collection.on('add', this.render, this);

                this.getSize();
            },
            el: $('#container'),
            events: {'click': 'newStickerForm'},
            getSize: function() {
                this.coords = getCoords(this.el);
                this.coords.bottom = this.el.clientHeight + this.coords.top;
                this.coords.right = this.el.clientWidth + this.coords.left;
            },
            render: function() {
                event.preventDefault();
                this.$el.html("");
                this.collection.each(this.addOneSticker, this);
				return this;
            },
            addOneSticker: function(model) {
                model.set({'container_size': this.coords});
                var view = new StickerView({
                    "model": model
                });

                this.$el.append(view.render().el);
            },
            newStickerForm: function(event) {
                event = fixEvent(event);
                //var coords = {top: event.clientY, left: event.clientX};
                //coords = getCoords(coords);

                this.sticker_add_form.coords = {top: event.pageY, left: event.pageX};
                this.sticker_add_form.render();
                console.log('left click add new sticker');
            },
            addStickerToCollection: function(content, coords) {
                this.collection.add(new Sticker({'content': content, 'coords': coords}));
            }
        });

    var app = new StickerCollectionView();

    app.render();

};


function fixEvent(e) {
    var html = document.documentElement,
        body = document.body;

    e = e || window.event;

    //добавление стандартных свойств: target, pageX/pageY, which
    if (!e.target) e.target = e.srcElement;

    if (e.pageX == null && e.clientX != null ) { // если нет pageX..


        e.pageX = e.clientX + (html.scrollLeft || body && body.scrollLeft || 0);
        e.pageX -= html.clientLeft || 0;

        e.pageY = e.clientY + (html.scrollTop || body && body.scrollTop || 0);
        e.pageY -= html.clientTop || 0;
    }

    if (!e.which && e.button) {
        e.which = e.button & 1 ? 1 : ( e.button & 2 ? 3 : ( e.button & 4 ? 2 : 0 ) )
    }

    return e;
}

function getCoords(elem) {
    var box = elem.getBoundingClientRect(),
        body = document.body,
        docElem = document.documentElement,
    //прокрутка страницы
        scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop,
        scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft,
    //в IE документ может быть смещен относительно левого верхнего угла
        clientTop = docElem.clientTop || body.clientTop || 0,
        clientLeft = docElem.clientLeft || body.clientLeft || 0,
    //координаты + прокрутка - смещение
        top  = box.top +  scrollTop - clientTop,
        left = box.left + scrollLeft - clientLeft;

    return { top: Math.round(top), left: Math.round(left) };
}

function opasity(element, param_obj, endCallback) {
    if(param_obj.start > 1 && param_obj.end > 1) {
        param_obj.start /= 100;
        param_obj.end /= 100;
    }
    var appear_disappear = (param_obj.end > param_obj.start),
        curent_opasity = param_obj.start,
        delta_opasity = 0.01,
        delta_time = Math.abs(Math.round(param_obj.time / ((param_obj.end - param_obj.start) / delta_opasity))),
        timer_handler;

    endCallback = endCallback || function() {};

    element.style.opacity = param_obj.start;
    element.style.filter='alpha(opacity='+param_obj.start*100+')';
    timer_handler = setInterval(function() {

        curent_opasity = appear_disappear ? curent_opasity + delta_opasity : curent_opasity - delta_opasity;
        element.style.opacity = curent_opasity;
        element.style.filter='alpha(opacity='+curent_opasity*100+')';

        if(appear_disappear) {
            if(curent_opasity >= param_obj.end) {
                clearInterval(timer_handler);
                endCallback();
            }
        } else {
            if(curent_opasity <= param_obj.end) {
                clearInterval(timer_handler);
                endCallback();
            }
        }
    }, delta_time);
}