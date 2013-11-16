window.onload = function() {

    var Sticker = Backbone.Model.extend({
            defaults: {
                content: "undefined"
            }
        }),

        StickerCollection = Backbone.Collection.extend({
            model: Sticker,
            initialize: function() {
                this.add(new Sticker({'content': 'cash a check'}));
                this.add(new Sticker({'content': 'buy a christmas tree'}));
                this.add(new Sticker({'content': 'go to the hospital'}));
                this.add(new Sticker({'content': 'return the book'}));
                this.add(new Sticker({'content': 'buy napalm'}));
                this.add(new Sticker({'content': 'capture the world'}));
            }
        }),

        StickerView = Backbone.View.extend({
            tagName: 'div',
            className: "sticker",
            template: _.template('<%= content %>'),
            initialize: function() {
                this.sticker_edit_form = new StickerEditView();
                this.render();
            },
            events: {'contextmenu': 'deleteSticker',
                     'dblclick': 'editSticker',
                     'click': 'clickLeft'},
            render: function() {
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
            editSticker: function(event) {
                event.stopPropagation();
                this.sticker_edit_form.model = this.model;
                this.sticker_edit_form.render();
                console.log('dbclick on sticker');
            },
            clickLeft: function(event) {
                event.stopPropagation();
                console.log('click on sticer');
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
                //this.model.trigger('change');
            },
            cancelChanges: function() {
                this.$el.html(""); //зачищает форму
            },
            render: function() {
                this.$el.html(this.template(this.model.toJSON())); //отображение с шаблона
                //вставка в поле данного контента
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
                this.collection_view
                    .collection
                    .add(new Sticker({'content': this.$el.find('#add_content')
                        .val()}));

                this.collection_view.render();
                this.$el.html("");
            },
            render: function() {
                this.$el.html(this.template());
            }
        }),

        StickerCollectionView = Backbone.View.extend({
            initialize: function() {
                this.collection = new StickerCollection();
                this.sticker_add_form = new StickerAddView();
                this.sticker_add_form.collection_view = this;
            },
            el: $('#container'),
            events: {'click': 'addNewSticker',
                     'dblclick': 'dbOnTable',
                     'contextmenu': 'render'},
            render: function() {
                event.preventDefault();
                this.$el.html("");
                this.collection.each(this.addOneSticker, this);
            },
            addOneSticker: function(model) {
                var view = new StickerView({
                    "model": model
                });
                this.$el.append(view.render().el);
            },
            dbOnTable: function() {
                console.log('db click on table');
            },
            addNewSticker: function() {
                this.sticker_add_form.render();
                console.log('left click add new sticker');
            }
        });

    var app = new StickerCollectionView();

    app.render();

};