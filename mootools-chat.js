/**
 * MootoolsChat v1.0
 * Developed by Diego de Pablos
 * 31/12/2011
 */

var ChatFactory = new Class({
	Implements: [Options],
	chatContainer: [],
	notifier: null,
	
	options: {
		rootDir: 		'',
		windowRefresh:	60,
		chatRefresh:	3,
		chatWidth:		220,
		me:				'Me'
	},
	
	initialize: function(options){
        this.setOptions(options);
        this.notifier = new WindowNotifier();
        var self = this;
        
        // checks if there are new messages periodically
        var req = new Request.JSON({
			method: 'get',
			url: this.options.rootDir + '/getters/getnewchats.php',
			initialDelay: this.options.windowRefresh*1000,
		    delay: this.options.windowRefresh*1000,
			
			onSuccess: function(responseJSON, responseText) {
				var info = responseJSON;
				$each(info, function(value, key) {
					if (!self.contains(value['id'])) {
						self.add(
							{
								id: value['id'],
								name: value['apodo'],
								visible: true
							}
						);
						self.notify(self.chatContainer[self.chatContainer.length-1]);
					}
				}); 
			}
		}).startTimer();
        
        this.associate();
    },
	
	add: function(options) {
    	//setting the properties
    	options.position = this.chatContainer.length;
    	options.rootDir = this.options.rootDir;
    	options.time = this.options.chatRefresh;
    	options.me = this.options.me;
    	options.width = this.options.chatWidth;
    	 
    	var chat = new Chat(options);
    	chat.addEvent('onDestroy', this.remove.bind(this));
    	chat.addEvent('onNotify', this.notify.bind(this));
    	chat.addEvent('onUnnotify', this.unnotify.bind(this));
    	
    	this.chatContainer.include(chat);
    },
	
	remove: function(chat) {
    	this.chatContainer.erase(chat);
    	
    	//we have to arrange the windows
    	this.chatContainer.each(function(chat,index) {
    		chat.move(index);
    	});
    },
    
    contains: function(id) {
    	var contiene = false;
    	this.chatContainer.each(function(chat,index) {
    		if (chat.options.id==id) {
    			contiene = true;
    		}
    	});
    	return contiene;
    },
    
    indexOf: function(id) {
    	var posicion = -1;
    	this.chatContainer.each(function(chat,index) {
    		if (chat.options.id==id) {
    			posicion = index;
    		}
    	});
    	return posicion;
    },
    
    associate: function() {
    	var self = this;
    	$$('a.chatCommand').each(function(enlace,index) {
			enlace.addEvent('click', function(event) {
	     		var propiedades = JSON.decode(this.get('rel'));
	     		var posicion = self.indexOf(propiedades.id);
	         	if (posicion==-1) {
	         		//it wasn't created, we do it
	         		self.add(propiedades);
	         	} else {
	         		if (!self.chatContainer[posicion].options.visible) {
	         			//the window is minimized, we maximize it
	         			self.chatContainer[posicion].toggle();
	         		} else {
	         			//setting the focus
	         			self.chatContainer[posicion].focus();
	         		}
	         	}
	     	});
	    });
    },
    
    notify: function(chat) {
    	if (!this.notifier.flashing) {
	    	this.notifier.setOptions({
	    		title: chat.options.name
	    	});
	    	this.notifier.notify();
    	}
    },
    
    unnotify: function() {
    	if (this.notifier.notify) {
    		this.notifier.unnotify();
    	}
    }
});

var Chat = new Class({
	
	Implements: [Options,Events],
	
	cabecera: null,
	nombre: null,
	cuerpo: null,
	conmutador: null,
	contenido: null,
	cuadromensaje: null,
	notificacion: null,
	chat: null,
	textQueue: null,
	formulario: null,
	enviador: null,
	escuchador: null,
	actualizador: null,
	visible: false,
	
	options: {
		rootDir: 	'',
		me:			'Me',
		width:		220,
		id: 		null,
		name: 		'',
		visible:	true,
		position:	0,
		time:		3
	},
	
	initialize: function(options){
        this.setOptions(options);
        this.create();
    },

	create: function() {
    	/* creating the window */
    	var cuadromensaje = new Element('textarea',{
    		name: 'mensaje',
    		events: {
    		    keydown: function(e) {
		    		if (e.shift && e.key == 'enter') {
		    			//normal behaviour
		    		}
		    		else if (e.key=='enter') {
		    			e.stop();
		    			this.sendMessage();
		    		}
    		    }.bind(this),
    		    
    		    focus: function(e) {
    				/*windows notification integration*/
    				this.fireEvent("unnotify", this); // notify the instance

    		    	this.cuadromensaje.addClass('focus');
    				this.scrollToBottom();
    		    }.bind(this),
    		    
    		    blur: function(e) {
    		    	this.cuadromensaje.removeClass('focus');
    		    }.bind(this)
    		  }
    		});
    	
    	var formulario = new Element('form', {
    		action: this.options.rootDir + '/setters/updatechatmsg.php?id=' + this.options.id,
    		method: 'POST'
    	});
    	
    	var notificacion = new Element('p', {
    		'class': 'notificar',
    		styles: {
    		    display: 'none'
    		}
    	});
    	var envioWrapper = new Element('div', {
    		'class': 'escribir'
    	});
    	var contenido = new Element('div', {
    		'class': 'contenido'
    	});
    	var cuerpo = new Element('div', {
    		'class': 'cuerpo'
    	}); 
    	var cabecera = new Element('div', {
    		'class': 'cabecera'
    	}); 
    	
    	/* buttons */
    	var cerrar = new Element('a', {
    		'class': 'close',
			events: {
    			click: function(e) {
		    		this.close();
			    }.bind(this)
    		}
    	});
    	var toggle = new Element('a', {
    		'class': 'minimize',
    		events: {
    			click: function(e) {
		    		this.toggle();
			    }.bind(this)
    		}
    	}); 
    	var nombre = new Element('a', {
    		'class': 'name',
    		html: this.options.name,
    		events: {
    			click: function(e) {
		    		this.toggle();
			    }.bind(this)
    		}
    	}); 
    	var chat = new Element('div', {
    		'class': 'chat',
    		styles: {
		    	right: this.options.width * (this.options.position+0.1) + 'px'
			}
    	}); 
    	
    	formulario.adopt(cuadromensaje);
    	envioWrapper.adopt(notificacion);
    	envioWrapper.adopt(formulario);
    	cuerpo.adopt(contenido);
    	cuerpo.adopt(envioWrapper);
    	cabecera.adopt(cerrar);
    	cabecera.adopt(toggle);
    	cabecera.adopt(nombre);
    	chat.adopt(cabecera);
    	chat.adopt(cuerpo);
    	
    	this.cabecera = cabecera;
    	this.nombre = nombre;
    	this.cuerpo = cuerpo;
    	this.conmutador = toggle;
    	this.contenido = contenido;
    	this.cuadromensaje = cuadromensaje;
    	this.notificacion = notificacion;
    	this.chat = chat;
    	this.formulario = formulario;
    	
    	this.enviador = new Request({
    		method: 'post', 
    		url: this.formulario.get('action')
    	});
    	
    	this.escuchador = new Request.JSON({
    		method: 'get',
    		url: this.options.rootDir + '/getters/getchatinfo.php?id=' + this.options.id,
    		initialDelay: 0,
    	    delay: this.options.time*1000,

    		onSuccess: function(responseJSON, responseText) {
    			var info = responseJSON;
    			var escribir = "";
    			
    			$each(info.mensajes, function(value, index) {
    				escribir = escribir + value;
    			}); 
    				
    			if (this.contenido.get('html')!=escribir) {
    				this.contenido.set('html', escribir);
    				this.scrollToBottom();
    			}
    			
    			if (info.nuevos>0) {
    				/*windows notification integration*/
    				this.fireEvent("notify", this); // notify the instance
    			}
    			
   				//header has changed, we update it
   				if (this.nombre.get('html')!=info.cabecera) {
   					this.nombre.set('html',info.cabecera); 
   				}
    			
    			if (info.abiertocontrario==0 || info.maximizadocontrario==0) {
					//if the recipient has closed the window or minimized it, it has no sense to bomb the server looking for new messages, so we increase the delay
    				this.escuchador.options.delay = (this.options.time*1000)*10;
    			} else {
    				this.escuchador.options.delay = this.options.time*1000;
    			}
    			
    			if (info.notificacion!=null) {
    				//there is a notification
    				this.notificacion.set('html',info.notificacion);
    				this.notificacion.show();
    			} else {
    				this.notificacion.hide();
    			} 
    		}.bind(this)
    	});
        	
    	this.escuchador.startTimer();
    	this.visible = true;
    	this.actualizador = new Request({
			method: 'get',
			url: this.options.rootDir + '/setters/updatechatstatus.php',
			data: {
				id:	this.options.id,
				m:	this.options.visible,
				o:	true,
				p:	this.options.position
			}
		}).send();
    	
    	$('chatContainer').adopt(chat);
    	
    	if (this.options.visible) {
    		this.focus();
    	} else {
    		this.conmutador.swapClass('minimize','maximize');
    		this.cuerpo.toggle();
    	}
	}.protect(),
    
    sendMessage: function() {
		var actual = this;
		
		if (this.cuadromensaje.value.length>0) {
		
			if (this.escuchador.isRunning()) {
				this.escuchador.cancel();
			}

			this.escuchador.stopTimer();
			
			this.textQueue = this.cuadromensaje.value;
			this.cuadromensaje.value = "";
			
			var mensaje = new Element('p', {
				'class': this.options.me
			});
			mensaje.set('html','<span>' + this.options.me + ':</span> ' + this.textQueue);
			
			this.contenido.adopt(mensaje);
			this.scrollToBottom();
			
			this.enviador.setOptions({data: this.cuadromensaje.get('name') + "=" + this.textQueue});
			this.enviador.send().addEvent('complete', function() {
				actual.escuchador.startTimer();
			});
		}
	},
	
	scrollToBottom: function() {
		var scroll = this.contenido.getScrollSize();
		this.contenido.scrollTo(0,scroll.y);
	},
	
	toggle: function() {
		this.options.visible = !this.options.visible;
		
		this.cuerpo.toggle();
		
		if (this.options.visible) {
			this.options.name = this.options.name.replace(/\([0-9]*\)/g, '');
			this.conmutador.swapClass('maximize','minimize');
			this.nombre.set('html',this.options.name);
			this.focus();
		} else {
			this.conmutador.swapClass('minimize','maximize');
		}
		
		this.actualizador.setOptions({
			data: {
				id:	this.options.id,
				m:	this.options.visible
			}
		}).send();
	},
	
	close: function() {
		if (this.escuchador.isRunning()) {
			this.escuchador.cancel();
		}
		this.escuchador.stopTimer();
		this.actualizador.setOptions({
			data: {
				o:	false
			}
		}).send();
		
		/*windows notification integration*/
		this.fireEvent("unnotify", this); // notify the instance
		
		this.chat.destroy();
		this.fireEvent("destroy", this); // notify the instance
	},
	
	focus: function() {
		this.cuadromensaje.focus();
		
		/*windows notification integration*/
		this.fireEvent("unnotify", this); // notify the instance
	},
	
	move: function(position) {
		this.options.position = position;
		this.chat.set('style','right: ' +  this.options.width * (this.options.position+0.1) + 'px');
	}
});

var WindowNotifier = new Class({
	Implements: [Options,Events],
	
	flashing: 	false,
	changed:	false,
	interval:	null,
	
	options: {
		originaltitle:	'',
		title:			'',
		delay:			1000
	},

	initialize: function() {
		this.options.originaltitle = document.title;
	},
	
	flash: function() {
		if (!this.changed) {
			document.title = this.options.title;
			this.changed = true;
		} else {
			document.title = this.options.originaltitle;
			this.changed = false;
		}
	},
	
	notify: function() {
		this.flashing = true;
		this.interval = this.flash.periodical(this.options.delay,this);
	},
	
	unnotify: function() {
		this.flashing = false;
		clearInterval(this.interval);
		document.title = this.options.originaltitle;
		this.changed = false;
	}	
});
