/*! Хитрая библиотека для работы с не менее Хитрым API v2.0
 * http://api.foxtools.ru/v2
 * http://foxtools.ru
 * 
 * Версия библиотеки: 1.0-beta (2 мая 2015 года)
 * ----------------------------------------------------------------------------
 * Copyright (c) Aleksey Nemiro, 2015. All rights reserved.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ----------------------------------------------------------------------------
 */
 
module foxtools {

	/** Статичный класс хитрых настроек хитрой библиотеки. */
	export class config {

		/** Имя куки, где следует хранить маркер доступа. */
		static tokenCookieName: string = 'foxtoken';

		/** Базовый адрес, из которого формируется адрес, на который будет отправлен запрос классом request. */
		static requestBaseUrl: string = '{0}://api.foxtools.ru/v2/{1}';

		/** 
		 * Указывает, следует использовать защищенное соединение при выполнении запросов классом request. 
		 * По умолчанию - false (использовать обычное соединение). 
		 */
		static useSsl: boolean = false;

	}

	/** Представляет процесс выполнения запроса. */
	export class requestProcess {

		/** Маркер доступа, либо адрес для получения маркера доступа. */
		public token: any = null;

		/** Функция, которая будет вызвана после завершения выполнения запроса. */
		public complete: (result: any) => any;

		/** Функция, которая будет вызвана перед отправкой запроса. */
		public begin: (data: beginRequest) => any;

		/** 
		 * Функция, которая будет вызываться при изменении процесса отправки запроса на хитрый сервер.
		 * @param percent Процент переданных данных.
		 * @param loaded Количество переданных байт.
		 * @param total Общий объем данных, которые будут отправлены на сервер.
		 */
		public uploading: (percent: number, loaded: number, total: number) => any;

		constructor() {
		}

	}

	/** Представляет базовый класс результата выполнения запроса. */
	export class baseResult {

		/** Тип результата. */
		public type: string;

		/** Системные сообщения. */
		public messages: Array<messageItem> = new Array<messageItem>();

		/** Детали выполнения запроса, если параметр details (при запросе) был равен true. */
		public trace: Array<traceItem> = new Array<traceItem>();

		/** 
		 * Инициализирует новый экземпляр baseResult.
		 * @param t Тип запроса.
		 */
		constructor(t: string) {
			if (t === undefined || t === null || t === '') {
				throw new Error('Type is required.');
			}
			this.type = t;
		}

		public addTrace(message: string, elepsedTime: string): void {
			this.trace.push(new traceItem(message, elepsedTime));
		}

		public addMessage(type: string, text: string): void {
			this.messages.push(new messageItem(type, text));
		}

	}
	
	/** Вспомогательный метод для отправки запросов к хитрому API v2.0. */
	export function api(selector?: string, options?: any): lib {
		return new lib(selector, options);
	}

	/** Основной класс для работы с хитрым API v2.0. */
	export class lib {

		constructor(selector?: any, options?: requestProcess) {
			var $this = this;

			if ($(selector).length > 0) {
				// если есть к чему привязаться, привязываемся
				$(selector).each(function () {
					if (this.tagName.toLowerCase() == 'form') {
						// нашли форму, привязываем к событию отправки
						$(this).submit(function () {
							// создаем запрос
							options = options || new requestProcess();
							var request = new formRequest(this);
							request.token = options.token;
							request.complete = options.complete;
							request.begin = options.begin;
							request.uploading = options.uploading;
							// проверяем атрибуты формы
							if ($(this).data('begin') !== undefined && $(this).data('begin') !== '' && typeof window[$(this).data('begin')] === 'function') {
								request.begin = window[$(this).data('begin')];
							}
							if ($(this).data('complete') !== undefined && $(this).data('complete') !== '' && typeof window[$(this).data('complete')] === 'function') {
								request.complete = window[$(this).data('complete')];
							}
							if ($(this).data('token') !== undefined && $(this).data('token') !== '') {
								request.token = $(this).data('token');
							}
							// отправляем форму
							request.submit();
							// отменяем синхронную отправку формы
							return false;
						});
					} else {
						console.log('WARNING: Expected a form tag.');
					}
				});
			}
		}

		/**
		 * Универсальная вспомогательная функция, которая возвращает маркер доступа. Если необходимо, делает запрос к ВАШЕМУ серверу.
		 * @param url Адрес ВАШЕЙ страницы, которая вернет маркер доступа для текущего пользователя, если маркера не будет в cookies.
		 */
		public getToken(url: any, options?: any): string {
			var token = null;

			// если в первый параметр передали объект, обрабатываем его
			if (typeof url == 'object') {
				if (options === undefined && options === null) {
					options = url;
				} else {
					$.extend(options, url);
				}
				// адрес должен быть в параметре url
				url = options.url;
			}

			// чтобы не быть нулем, достаточно быть пустым
			options = options || {};

			// проверяем куку
			if (!(token = utility.readCookies(config.tokenCookieName))) {
				// нету в куки не куку, получаем маркер с сервера
				if (url === undefined || url === null) {
					console.log('Url is empty. No way to get a new token...');
					return token;
				}

				// адрес есть, дергаем его, за ухи
				$.ajax({
					type: options.type || 'POST',
					enctype: options.enctype || 'application/x-www-form-urlencoded',
					url: url,
					success: function (result) {
						// маркер доступа успешно получен, танцуют все!

						// смотрим, в каком формате данные
						if (typeof result == 'object') {
							// ай-я-яй, какая жаль
							// смотрим, что есть в объекте
							if (result.token !== undefined && result.token !== null && typeof result.token == 'string') {
								result = result.token;
							}
							else if (result.value !== undefined && result.value !== null && typeof result.value == 'string') {
								result = result.value;
							}
							else if (result.data !== undefined && result.data !== null && typeof result.data == 'string') {
								result = result.data;
							}
							else {
								// бамбарбия киргуду!
								// берем первое, что есть
								result = result[Object.keys(result)[0]];
							}
						}

						// бережно кладем маркер доступа в куку
						utility.createCookies(config.tokenCookieName, result);
						
						if (options.complete !== undefined && options.complete !== null && typeof options.complete === 'function') {
							// есть куда передавать ответ, передаем
							options.complete(new stringResult(result));
						}
					},
					error: function (x, textStatus, errorThrown) {
						// ошибка
						if (options.complete !== undefined && options.complete !== null && typeof options.complete === 'function') {
							// есть куда передавать ответ, передаем
							options.complete(new errorResult(new errorMessage(0, textStatus + ': ' + errorThrown)));
						} else {
							// некуда передавать ответ, просто пишем в консоль
							console.log(textStatus + ': ' + errorThrown);
						}
					}
				});
			}

			return token;
		}

		/** Вызывается при загрузке документа. */
		static ready(): void {
			utility.initYa();
		}

	}

	/** Представляет аргументы события начала выполнения запроса. */
	export class beginRequest {

		/** Ссылка на запрос, который будет выполняться. */
		public request: requestProcess = null;

		/** Маркер доступа, который будет использоваться. */
		public token: foxtoolsToken = null;

		/** Указываает на необходимость отмены выполнение запроса. */
		public cancel: boolean = false;

		constructor(request: requestProcess, token: foxtoolsToken) {
			this.request = request;
			this.token = token;
		}

	}

	/** Представляет хитрый запрос к API из формы. */
	export class formRequest extends requestProcess {

		public form: HTMLFormElement = null;

		constructor(form: HTMLFormElement) {
			super();

			this.form = form;
		}

		/** Отправляет форму. */
		public submit() {
			var $request = this;

			// если есть маркер, hfp,bhftv tuj
			var token = utility.parseToken($request.token);

			// если есть адрес для получения маркера, а самого маркера нет
			if (token !== null && token.url !== null && token.value === null) {
				// смотрим, что есть в куке
				token.value = utility.readCookies(config.tokenCookieName);
			}

			// если опять есть адрес, а маркера нет, то делаем запрос на получения нового маркера
			if (token !== null && token.url !== null && token.value === null) {
				new lib().getToken(token.url, {
					type: $request.token.type,
					enctype: $request.token.enctype,
					complete: function (result: baseResult) {
						if (result.type == 'errorResult') {
							// ошибка, значит запрос невозможно выполнить
							throw new Error((<errorResult>result).getText());
						} else {
							// используем полученный маркер для выполнения запроса
							token.value = (<stringResult>result).value;
							$request.justSubmit(token);
						}
					}
				});
			} else {
				// адреса нет, либо есть маркер, просто выполняем запрос
				$request.justSubmit(token);
			}
		}

		/** 
		 * Просто асинхронно отправляет форму.
		 * @param token Маркер доступа, который следует использовать для запроса.
		 */
		private justSubmit(token: foxtoolsToken) {
			var $request = this;
			var form = $request.form;
			var $form = $($request.form);

			//var enctype = $form.attr('enctype');
			var type = $form.attr('method') || 'GET';

			if ($('input[type=file]', form).length > 0) {
				type = 'POST';
				//enctype = 'multipart/form-data';
			}

			//if (type.toUpperCase() == 'POST' && (enctype === undefined || enctype === null || enctype == '')) {
				//enctype = 'application/x-www-form-urlencoded';
			//}


			var headers = null;

			// маркер доступа, если указан
			if (token !== null && token.value !== null && token.value != '') {
				headers = { Authorization: 'Bearer ' + token.value };
			}

			var methodName: string = $($form.attr('action').split('/')).last()[0].toString();
			methodName = (methodName.indexOf('?') != -1 ? methodName.substr(0, methodName.indexOf('?')) : methodName);

			// если есть обработчик, делаем событие begin
			if ($request.begin !== undefined && $request.begin !== null && typeof $request.begin === 'function') {
				var eventData = new beginRequest(<requestProcess>$request, token);
				$request.begin(eventData);
				// запрос отменен
				if (eventData.cancel) {
					return;
				}
				form = $request.form;
				$form = $(form);
			}
			// --

			var data = null;

			if (type.toUpperCase() == 'POST') { // && enctype == 'multipart/form-data'
				data = new FormData(form);
			} else {
				data = $form.serialize();
			}

			utility.yah($form.attr('action'), methodName);

			$.ajax({
				type: type,
				url: $form.attr('action'),
				data: data,
				dataType: 'json', //jsonp
				headers: headers,
				xhr: function () {
					var xhr = $.ajaxSettings.xhr();
					if (xhr.upload) {
						xhr.upload.addEventListener('progress', function (e) {
							if (e.lengthComputable) {
								if ($request.uploading !== undefined && $request.uploading !== null && typeof $request.uploading === 'function') {
									$request.uploading(Math.round((e.loaded * 100) / e.total), e.loaded, e.total);
								}
							}
						}, false);
					}
					return xhr;
				},
				beforeSend: function (x) {
					// ставим отметку, что началось выполнение запроса
					$form.removeData('completed');
					$form.data('sending', 'true');
				},
				success: function (r) {
					if ($request.complete !== undefined && $request.complete !== null && typeof $request.complete === 'function') {
						$request.complete(new result(methodName, 200, null, r));
					} else {
						new result(methodName, 200, null, r);
					}
				},
				error: function (x, textStatus, errorThrown) {
					var r = new result(methodName, x.status, errorThrown, $.parseJSON(x.responseText || errorThrown)); // todo: проверить возможность использования x.responseJSON
					// смотрим, если ошибка связана с маркером доступа
					if (r.data.type == 'errorResult' && $.grep((<errorResult>r.data).items, function (error) { return error.code == errorCode.AccessTokenError || error.code == errorCode.AccessTokenNotFound || error.code == errorCode.NoPermissionToUseTokenForCurrentIp }).length > 0) {
						// то запрашиваем новый маркер; конечно, при наличии адреса и отсутствии ошибок получения
						if (token.url !== null && token.errors == 0) {
							// убиваем куку
							utility.eraseCookies(config.tokenCookieName);
							// адрес получения маркера передаем в запрос
							$request.token = { url: token.url, errors: token.errors + 1 };
							// выполняем запрос повторно
							$request.submit();
							return;
						}
					}
					// другая ошибка, или нет адреса для получения маркера доступа
					if ($request.complete !== undefined && $request.complete !== null && typeof $request.complete === 'function') {
						$request.complete(r);
					} 
				},
				complete: function (x, status) {
					// ставим отметку, что запрос успешно выполнен
					$form.removeData('sending');
					$form.data('completed', 'true');
				},
				cache: false,
				processData: false,
				contentType: false
			});
		}

	}

	/** Представляет хитрый запрос к хитрому API. */
	export class request extends requestProcess {

		/** Базовый адрес, из которого формируется конечный адрес, на который будет отправлен запрос. */
		public baseUrl: string = config.requestBaseUrl;

		/** Использовать защищенное соединение или нет (пока не используется, нет нормального сертификата). */
		public useSsl: boolean = config.useSsl;

		/** 
		 * Метод, который следует использовать для запроса: GET или POST. 
		 * Может быть определен автоматически, в зависимости от параметров запроса.
		 */
		public type: string = 'GET';

		/** Параметры запроса.*/
		public parameters: httpParameterCollection;

		/** Итоговый адрес, на который будет отправлен запрос (формируется автоматически). */
		private endpoint: string = '';

		/** Название метода, который следует выполнить. */
		private methodName: string = '';
				
		constructor(methodName: string) {
			super();

			if (methodName === undefined || methodName === null) {
				throw new Error(
					'Method name is required. Please add method name to request:\r\n' +
					'You can find a list of methods on the page: http://api.foxtools.ru/v2'
				);
			}

			this.methodName = methodName;
			this.endpoint = utility.format(this.baseUrl, [(this.useSsl ? 'https' : 'http'), methodName]);
			this.parameters = new httpParameterCollection();
		}

		/** Выполняет запрос к API. */
		public execute() {
			var $request = this;

			// если есть, разбираем маркер
			var token = utility.parseToken($request.token);

			// если есть адрес для получения маркера, а самого маркера нет
			if (token !== null && token.url !== null && token.value === null) {
				// смотрим, что есть в куке
				token.value = utility.readCookies(config.tokenCookieName);
			}

			// если опять есть адрес, а маркера нет, то делаем запрос на получения нового маркера
			if (token !== null && token.url !== null && token.value === null) {
				new lib().getToken(token.url, {
					type: $request.token.type,
					enctype: $request.token.enctype, 
					complete: function (result: baseResult) {
						if (result.type == 'errorResult') {
							// ошибка, значит запрос невозможно выполнить
							throw new Error((<errorResult>result).getText());
						} else {
							// используем полученный маркер для выполнения запроса
							token.value = (<stringResult>result).value;
							$request.justExecute(token);
						}
					}
				});
			} else {
				// адреса нет, либо есть маркер, просто выполняем запрос
				$request.justExecute(token);
			}
		}

		/** 
		 * Совершенно точно и без лишних вопросов выполняет хитрый запрос к хитрому API.
		 * @param token Маркер доступа, который следует использовать при отправке запроса.
		 */
		private justExecute(token: foxtoolsToken) {
			var $request = this;

			// определяем тип запроса и тип содержимого
			//var enctype = null;
			var type = $request.type || 'GET';

			if ($request.parameters.hasFiles) {
				type = 'POST';
				//enctype = 'multipart/form-data';
			}

			//if (type.toUpperCase() == 'POST' && (enctype === undefined || enctype === null || enctype == '')) {
				//enctype = 'application/x-www-form-urlencoded';
			//}

			// если указан маркер доступа, используем его для данного запроса
			var headers = null;
			if (token !== null && token.value !== null && token.value != '') {
				headers = { Authorization: 'Bearer ' + token.value };
			}

			// если есть обработчик, делаем событие begin
			if ($request.begin !== undefined && $request.begin !== null && typeof $request.begin === 'function') {
				var eventData = new beginRequest(<requestProcess>$request, token);
				$request.begin(eventData);
				// запрос отменен
				if (eventData.cancel) {
					return;
				}
			}

			var data = $request.parameters.toParams(type);

			utility.yah($request.endpoint, $request.methodName);

			$.ajax({
				url: $request.endpoint,
				type: type,				//dataType: 'jsonp',				headers: headers,				xhr: function () {
					var xhr = $.ajaxSettings.xhr();
					if (xhr.upload) {
						xhr.upload.addEventListener('progress', function (e) {
							if (e.lengthComputable) {
								if ($request.uploading !== undefined && $request.uploading !== null && typeof $request.uploading === 'function') {
									$request.uploading(Math.round((e.loaded * 100) / e.total), e.loaded, e.total);
								}
							}
						}, false);
					}
					return xhr;
				},
				// beforeSend: function (x) { },
				success: function (r) {
					if ($request.complete !== undefined && $request.complete !== null && typeof $request.complete === 'function') {
						$request.complete(new result($request.methodName, 200, null, r));
					} else {
						new result($request.methodName, 200, null, r);
					}
				},
				error: function (x, textStatus, errorThrown) {
					var r = new result($request.methodName, x.status, errorThrown, $.parseJSON(x.responseText || errorThrown)); // todo: проверить возможность использования x.responseJSON
					// смотрим, если ошибка связана с маркером доступа
					if (r.data.type == 'errorResult' && $.grep((<errorResult>r.data).items, function (error) { return error.code == errorCode.AccessTokenError || error.code == errorCode.AccessTokenNotFound || error.code == errorCode.NoPermissionToUseTokenForCurrentIp}).length > 0) {
						// то запрашиваем новый маркер; конечно, при наличии адреса и отсутствии ошибок получения
						if (token.url !== null && token.errors == 0) {
							// убиваем куку
							utility.eraseCookies(config.tokenCookieName);
							// адрес получения маркера передаем в запрос
							$request.token = { url: token.url, errors: token.errors + 1 };
							// выполняем запрос повторно
							$request.execute();
							return;
						}
					}
					// другая ошибка, или нет адреса для получения маркера доступа
					if ($request.complete !== undefined && $request.complete !== null && typeof $request.complete === 'function') {
						$request.complete(r);
					} 
					//else {
					//new result($request.methodName, x.status, errorThrown, $.parseJSON(x.responseText || errorThrown));
					//}
				},
				complete: function (x, status) {

				},
				data: data,
				cache: false,
				contentType: false,
				processData: false
			});
		}

	}

	/** Представляет коллекцию параметров запроса. */
	export class httpParameterCollection {

		/** Список параметров, находящихся в коллекции. */
		public items: Array<httpParameter>;

		constructor() {
			this.items = new Array<httpParameter>();
		}

		/** 
		 * Добавляет параметр в коллекцию. 
		 * @param name Имя параметра, либо элемент.
		 * @param value Значение параметра.
		 */
		public add(name: any, value: any) {
			this.items.push(new httpParameter(name, value));
		}

		/** 
		 * Возвращает параметры в виде объекта для выполнения запроса. 
		 * @param type Тип HTTP запроса: GET или POST.
		 */
		public toParams(type: string): Object {
			if (this.hasFiles || type === undefined || type === null) {
				type = 'POST';
			}
			type = type.toUpperCase();

			var result = null;

			if (type == 'POST') {
				result = new FormData();
			} else {
			 result = new Object();
			}

			for (var i = 0; i <= this.items.length - 1; i++) {
				if (type == 'POST') {
					if (this.items[i].isFile) {
						if (this.items[i].value.length == 1) {
							result.append(this.items[i].name, this.items[i].value[0]);
						}
						if (this.items[i].value.length > 1) {
							for (var j = 0; j <= this.items[i].value.length - 1; j++) {
								result.append(this.items[i].name + '[]', this.items[i].value[j]);
							}
						} else {
							result.append(this.items[i].name, null);
						}
					} else {
						result.append(this.items[i].name, this.items[i].value);
					}
				} else {
					result[this.items[i].name] = this.items[i].value;
				}
			}

			if (type == 'POST') {
				return result;
			} else {
				return $.param(result);
			}
		}
		
		/** Возвращает true, если в коллекции есть файлы.*/
		get hasFiles(): boolean {
			return $.grep(this.items, function (item: httpParameter) {
				if (item.isFile) {
					return true;
				}
			}).length > 0;
		}

	}

	/** Представляет один единственный параметр запроса. */
	export class httpParameter {

		/** Имя параметра. */
		public name: string;
		
		/** Значение параметра. */
		public value: any;

		/** Содержит значение true, если параметр является файлом. */
		public isFile: boolean = false;

		/** 
		 * Создает новый параметр. 
		 * @param name Имя параметра или элемент.
		 * @param value Значение параметра.
		 */
		constructor(name: any, value: any) {
			// проверяем наличие имени
			if (name === undefined || name === null) {
				throw new Error('Name is required.');
			}
			// проверяем, что указано в имени
			if (utility.isElement(name)) {
				// элемент формы
				this.name = $(name).attr('name');
				this.setValue(name);;
			}
			else if (utility.isJqueryObject(name)) {
				// объект jquery
				if (name.length) {
					this.name = name.attr('name');
					this.setValue(name);
				} else {
					throw new Error('jQuery object can not be empty.');
				}
			}
			else { // string и другие
				this.name = name;
				this.setValue(value);
			}
		}

		/** 
		 * Задает значение параметра в правильном виде.
		 * @param value Значение, которое нужно преобразовать в правильный вид.
		 */
		private setValue(value: any): void {
			if (utility.isElement(value)) {
				// элемент формы, делаем объект jQuery
				value = $(value);
			}
			else if (utility.isJqueryObject(value)) {
				// объект jQuery, проверяем наличие элемента
				if (!value.length) {
					throw new Error('jQuery object can not be empty.');
				}
			}
			else { // string и другие
				this.isFile = false;
				this.value = value;
				return;
			}

			if (value.is(':file')) {
				// выдергиваем файл, если это файл
				this.isFile = true;
				this.value = value[0].files;
			} else {
				// если не файл, то возвращаем строковое значение
				this.isFile = false;
				this.value = value.val();
			}
		}

	}

	/** Представляет результат выполнения запроса к API. */
	export class result {

		/** Данные результата выполнения запроса к API. */
		public data: baseResult;

		/** Метод, которому соответствует текущий результат выполнения запроса. */
		public methodName: string;

		constructor(methodName: string, statusCode: number, errorThrown: string, data: any) {
			if (statusCode === 0) {
				data.response.errors.items = [{ code: 0, text: 'Not connect. Verify Network.' }];
			} else if (statusCode == 404) {
				data.response.errors.items = [{ code: 0, text: 'Requested page not found [HTTP404].' }];
				/*} else if (x.status == 500) {
					r = new result(methodName, 'Internal Server Error [HTTP500].');*/
			} else if (errorThrown === 'parsererror') {
				data.response.errors.items = [{ code: 0, text: 'Requested JSON parse failed.' }];
			} else if (errorThrown === 'timeout') {
				data.response.errors.items = [{ code: 0, text: 'Timeout error.' }];
			} else if (errorThrown === 'abort') {
				data.response.errors.items = [{ code: 0, text: 'Ajax request aborted.' }];
			}

			if (data === undefined || data === null) {
				//throw new Error('Server response is empty.');
				return;
			}

			this.methodName = (methodName !== undefined && methodName !== null ? methodName.toLowerCase() : '');

			if (typeof data == 'object') {
				if (data.response === undefined || data.response === null) {
					//throw new Error('Server response is empty.');
					return;
				} else {
					data = data.response;
				}
			}
			else {
				this.data = new stringResult(data);
				return;
			}

			// есть информация об ошибках
			if (data.errors !== undefined && data.errors !== null) {
				this.data = new errorResult(data.errors);
			}
			else {
				// нормальный ответ, проверяем тип
				switch (this.methodName) {
					case 'geoip':
						this.data = new ipResult(data);
						break;

					case 'hash':
						this.data = new hashResult(data.items);
						break;

					case 'proxy':
						this.data = new proxyResult(data);
						break;

					// todo: классы http://api.foxtools.ru/v2
					case 'machinekey':
					case 'stat':
					case 'textdecoder':
					case 'translator':
					case 'weather':
					case 'webconverter':
					case 'eventlogger':
						this.data = data;
						break;

					// stringArrayResult 
					case 'pwd':
					case 'guid':
					case 'idn':
					case 'randomkey':
						this.data = new stringArrayResult(data);
						break;

					// stringResult 
					default:
						this.data = new stringResult(data.value);
						break;
				}
			}

			if (data.messages !== undefined && data.messages !== null) {
				// добавляем сообщения, если есть
				for (var i = 0; i <= data.messages.length - 1; i++) {
					this.data.addMessage(data.messages[i].type, data.messages[i].text);
				}
			}

			if (data.trace !== undefined && data.trace !== null) {
				// добавляем детальную информацию о выполнении запроса, если есть
				for (var i = 0; i <= data.trace.length - 1; i++) {
					this.data.addTrace(data.trace[i].message, data.trace[i].elapsedTime);
				}
			}
		}

		/** Возвращает true, если текущий результат содержит информацию об ошибках. */
		public get isError(): boolean {
			return this.data.type === 'errorResult';
		}

		/** Возвращает строковое значение результата выполнения запроса к API. */
		public toString() {
			return this.data.toString();
		}

	}
	
	/** Представляет информацию об ошибке при выполнении запроса к API. */
	export class errorResult extends baseResult {

		public items: Array<errorMessage> = new Array<errorMessage>();

		constructor(errors: any) {
			super('errorResult');

			if (errors !== undefined && errors !== null) {
				for (var i = 0; i <= errors.length - 1; i++) {
					//errors[i].charAt(0).toUpperCase() + errors[i].code.slice(1)
					this.add(<any>errorCode[errors[i].code], errors[i].text);
				}
			}
		}

		/** 
		 * Добавляет сообщение об ошибке в коллекцию.
		 * @param code Код ошибки.
		 * @param text Текст сообщения.
		 */
		public add(code: errorCode, text: string): void {
			this.items.push(new errorMessage(code, text));
		}

		/** Возвращает текст всех ошибок, находящихся в текущем экземпляре объекта. */
		public toString() {
			return this.getText();
		}

		public getText(): string {
			var errorMessage = '';
			for (var i = 0; i <= this.items.length - 1; i++) {
				if (errorMessage.length > 0) {
					errorMessage += '\n';
				}
				errorMessage += this.items[i].text;
			}
			return errorMessage;
		}

	}

	/** Представляет сообщение об ошибке. */
	export class errorMessage {

		/** Код ошибки.*/
		public code: errorCode;

		/** Текст сообщения.*/
		public text: string;

		/** 
		 * Создает новый экземпляр класса errorMessage.
		 * @param code Код ошибки.
		 * @param text Текст сообщения.
		 */
		constructor(code: errorCode, text: string) {
			this.code = code;
			this.text = text;
		}

	}

	/** Представляет системное сообщение. */
	export class messageItem {

		/** Тип сообщения. */
		public type: string;

		/** Текст сообщения. */
		public text: string;

		/** 
		 * Создает новый экземпляр класса messageItem.
		 * @param type Тип сообщения.
		 * @param text Текст сообщения.
		 */
		constructor(type: string, text: string) {
			this.type = type;
			this.text = text;
		}

	}

	/** Представляет элемент детальной информации о выполнении запроса. */
	export class traceItem {

		/** Текст сообщения. */
		public message: string;

		/** Затраченное время. */
		public elapsedTime: string;

		constructor(message: string, elapsedTime: string) {
			this.message = message;
			this.elapsedTime = elapsedTime;
		}

		/** Возвращает строковое представление текущего экземпляра объекта. */
		public toString() {
			return this.elapsedTime + '> ' + this.message;
		}

	}

	/** Представляет строковой результат выполнения запроса к API. */
	export class stringResult extends baseResult {

		/** Содержит строковое значение результата выполнения запроса к API. */
		public value: string;

		/** 
		 * Создает новый экземпляр класса stringResult.
		 * @param value Строковое значение результата выполнения запроса к API.
		 */
		constructor(value: string) {
			super('stringResult');
			this.value = value;
		}

		/** Возвращает строковое значение результата выполнения запроса к API. */
		public toString() {
			return this.value;
		}

	}

	/** Представляет строковой массив. */
	export class stringArrayResult extends baseResult {

		/** Элементы коллекции. */
		public items: Array<string> = new Array<string>();

		/** Номер текущей страницы. */
		public pageNumber: number = 0;

		/** Общее количество страниц. */
		public pageCount: number = 0;

		/**
		 * Создает новый экземпляр класса stringArrayResult.
		 * @param data Результат выполнения запроса к API.
		 */
		constructor(data: any) {
			super('stringArrayResult');
			this.items = data.items;
			this.pageNumber = data.pageNumber;
			this.pageCount = data.pageCount;
		}

		/** Возвращает строковое значение результата выполнения запроса к API. */
		public toString() {
			return this.items.join('\n');
		}

	}

	/** Представляет результат расчета хеш-суммы. */
	export class hashResult extends baseResult {

		/** Список полученных хеш-сумм. */
		public items: Array<hashItem> = new Array<hashItem>();

		constructor(items: any) {
			super('hashResult');

			if (items !== undefined && items !== null) {
				for (var i = 0; i <= items.length - 1; i++) {
					this.add(items[i].type, items[i].value);
				}
			}
		}

		/**
		 * Добавляет элемент в коллекцию.
		 * @param type Алгоритм.
		 * @param value Хеш-сумма.
		 */
		public add(type: string, value: string): void {
			this.items.push(new hashItem(type, value));
		}

	}

	/** Элемент результата расчета хеш-суммы. */
	export class hashItem {

		/** Алгоритм. */
		public type: string;

		/** Хеш-сумма. */
		public value: string;
		
		constructor(type: string, value: string) {
			this.type = type;
			this.value = value;
		}

	}

	/** Представляет результат выполнения запроса информации об IP. */
	export class ipResult extends baseResult {

		/** Адрес IP, о котором получена информация. */
		public ip: string;

		/** Индикатор указывает, является адрес IP прокси-сервером или нет. */
		public proxy: boolean = false;

		/** Информация о стране, которой принадлежит адрес. */
		public country: countryResult = null;

		/** Информация о городе, которому принадлежит адрес. */
		public city: cityResult = null;

		constructor(data: any) {
			super('ipResult');
			this.ip = data.ip;
			this.proxy = data.proxy;
			this.country = data.country || null;
			this.city = data.city || null;
		}

	}

	/** Представляет информацию о стране. */
	export class countryResult extends baseResult {

		public nameEn: string = null;
		public nameRu: string = null;
		public domain: string = null;
		public domainNational: string = null;
		public fips10: string = null;
		public id: string = null;
		public ioc: string = null;
		public iso3166a2: string = null;
		public iso3166a3: string = null;
		public iso3166num: string = null;
		public itu: string = null;
		public phoneCode: string = null;
		public stanag: string = null;
		public un: string = null;
		public unIso: string = null;

	}

	/** Представляет информацию о городе. */
	export class cityResult extends baseResult {

		public nameEn: string = null;
		public nameRu: string = null;
		public zip: string = null;
		public metroCode: string = null;
		public areaCode: string = null;
		public longitude: number = null;
		public latitude: number = null;

	}

	/** Представляет результат обращения за списком прокси-серверов. */
	export class proxyResult extends baseResult {

		/** Номер текущей страницы. */
		public pageNumber: number = 0;

		/** Общее количество страниц. */
		public pageCount: number = 0;

		/** Список полученных прокси-серверов. */
		public items: Array<proxyItem> = new Array<proxyItem>();
		
		constructor(data: any) {
			super('proxyResult');

			this.pageNumber = data.pageNumber;
			this.pageCount = data.pageCount;

			if (data.items !== undefined && data.items !== null) {
				for (var i = 0; i <= data.items.length - 1; i++) {
					this.add(data.items[i]);
				}
			}
		}

		public add(proxy: any): void {
			this.items.push(proxy);
		}

	}

	/** Представляет прокси-сервер, полученный из хитрого хранилища. */
	export class proxyItem {

		/** Адрес прокси-сервера. */
		public ip: string = '';

		/** Номер порта, по которому доступен прокси-сервер. */
		public port: number;

		/** Тип прокси-сервера. */
		public type: number;

		/** Уровень анонимности, который предоставляет прокси-сервер. */
		public anonymity: string;

		/** Время ответа (в секундах) на последний тестовый запрос. */
		public uptime: number;

		/** Дата и время последней проверки доступности прокси-сервера. */
		public checked: boolean;

		/** Статус доступности прокси-сервера. */
		public available: yesNoAny = yesNoAny.Any;

		/** Бесплатность прокси-сервера. */
		public free: yesNoAny = yesNoAny.Any;

		/** Информация о стране, в которой расположен прокси-сервер. */
		public country: countryResult = null;

	}
	
	/** Представляет хитрый маркер доступа. */
	export class foxtoolsToken {

		/** Маркер доступа. */
		public value: string = null;

		/** Адрес, который может вернуть новый маркер доступа (адрес на вашем сервере). */
		public url: string = null;

		/** 
		 * Число ошибок, которые возникли при получении маркера доступа. 
		 * Технический параметр, меняется автоматически.
		 */
		public errors: number = 0;

	}

	/** Вспомогательные полезняшки. */
	export class utility {

		/** Хитрый счетчик Яндекс.Метрика. */
		static yaCounter: any;

		/**
		 * Форматирует указанную строку.
		 * @param value Строка, в которую следует вставить параметры.
		 * @param args Пермеаметры, которые следует вставить в строку.
		 */
		static format(value: string, args: any): string {
			if (value === undefined || value === null || value === '') {
				console.log('Value is empty.');
				return null;
			}

			if (args.length === 1 && args[0] !== null && typeof args[0] === 'object') {
				args = args[0];
			}

			if (typeof args === 'string') {
				args = [args];
			}

			return value.replace(/{([^}]*)}/g, function (match, key) {
				return (typeof args[key] !== "undefined" ? args[key] : match);
			});
		}

		/** Делает куку. */
		static createCookies(name: string, value: string, days?: number) {
			var expires = '';
			var date = new Date();

			if (days !== undefined && days !== null) {
				date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
				expires = '; expires=' + date.toUTCString();
			}

			document.cookie = this.format('{name}={value}{expires}; path=/', { name: name, value: value, expires: expires });
		}

		/** Зачитывает куку вслух, с выражением, стоя на одной ноге на табуретке на кухне, в шубе и шапке ушанке, летом, ночью, в полнолуние. */
		static readCookies(name: string): string {
			var ca = document.cookie.split(';');

			name = name + '=';

			for (var i = 0; i < ca.length; i++) {
				var c = ca[i];
				while (c.charAt(0) == ' ') c = c.substring(1, c.length);
				if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
			}

			return null;
		}

		/** Стирает куку. */
		static eraseCookies(name: string) {
			utility.createCookies(name, '', -1);
		}

		/** Проверяет, является указанное значение элементом HTML или нет. */
		static isElement(element: any): boolean {
			if (element === undefined || element === null) {
				return false;
			}
			return (element instanceof HTMLElement);
		}

		/** Проверяет, является указанное значение объектом jQuery или нет. */
		static isJqueryObject(element: any): boolean {
			if (element === undefined || element === null) {
				return false;
			}
			return (element instanceof $);
		}

		/** Возвращает true, если браузер поддерживает работу с локальным хранилищем. */
		static clinetIsSupportLocalStorage(): boolean {
			try {
				return 'localStorage' in window && window['localStorage'] !== null;
			} catch (ex) {
				return false;
			}
		}

		/** 
		 * Разбирает хитрый маркер доступа.
		 * @param token Маркер доступа, который следует разобрать. Это может быть строка с маркером, либо url, либо объект.
		 */
		static parseToken(token: any): foxtoolsToken {
			if (token === undefined || token === null) {
				return null;
			}

			var result = new foxtoolsToken();

			// смотрим, чем является token
			if (typeof token == 'string') {
				// указана строка, проверяем, является значение маркером доступа или адресом
				if (/^[0-9A-Fa-f]{32}$/.test(token)) {
					// это маркер доступа
					result.value = token;
				} else {
					// считаем, что указан адрес для получения маркера доступа
					result.url = token;
				}
			}
			else if (typeof token == 'object') {
				// указан объект, смотрим что именно
				if (token.value !== undefined && token.value !== null && token != '') {
					// есть маркер доступа
					result.value = token.value;
				}
				if (token.url !== undefined && token.url !== null && token.url != '') {
					// указан адрес для получения маркера доступа
					result.url = token.url;
				}
				if (token.errors !== undefined && token.errors !== null) {
					// есть счетчик ошибок
					result.errors = token.errors;
				}
				if (result.value === null && result.url === null) {
					// ничего не указано
					throw new Error('Token not found.');
				}
			} else {
				// что-то другое
				throw new Error('Token value not supported.');
			}

			return result;
		}

		/**
		 * Отправляет хит в Яндекс.Метрику.
		 * @param url Адрес хитовой страницы.
		 * @param title Заголовок хитовой страницы.
		 */
		static yah(url: string, title?: string): void {
			try {
				//utility.initYa();
				if (utility.yaCounter !== undefined && utility.yaCounter !== null) {
					utility.yaCounter.hit(url, title, null);
				}
			}
			catch (ex) { }
		}

		/** Инициализирует Яндекс.Метрику. */
		static initYa(): void {
			try {

				// 24654338 - id хитрого счетчика (не менять! статистика нужна, статистика важна)

				if (window['Ya'] === undefined || window['Ya'] === null) {
					//$('<script src="//mc.yandex.ru/metrika/watch.js" type="text/javascript"></script>').appendTo('body');
					$.getScript('//mc.yandex.ru/metrika/watch.js', function () {
						utility.yaCounter = new window['Ya'].Metrika({ id: 24654338, enableAll: true });
					});
				} else {
					if (utility.yaCounter === undefined || utility.yaCounter === null) {
						utility.yaCounter = new window['Ya'].Metrika({ id: 24654338, enableAll: true });
					}
				}

			} catch (ex) { }
		}

	}

	/** Перечень режимов обработки данных. */
	export enum dataMode { auto = 0, encode = 1, decode = 2 }

	/** Перечень режимов обработки данных. */
	export enum outputFormat { text = 0, file = 1 }

	/** Перечень ошибок, которые может вернуть API. */
	export enum errorCode {
		None = 0,
		/** Внутренняя ошибка сервера. */
		InternalError = 1000,
		/** Не поддерживается. */
		NotSupported = 1001,
		/** Не реализовано. */
		NotImplemented = 1002,
		/** Невозможно обработать указанный тип данных. */
		UnableToProcessData = 1003,
		/** Вышло время ожидания завершения операции. */
		Timeout = 1004,
		/** Доступ запрещен. */
		AccessDenied = 1100,
		/** Общая ошибка маркера доступа. */
		AccessTokenError = 1110,
		/** Маркер доступа не найден. */
		AccessTokenNotFound = 1111,
		/** Нет разрешения на использования этого маркера доступа. */
		NoPermissionToUseTokenForCurrentIp = 1112,
		/** Адрес находится в черном списке. */
		AddressIsBlacklisted = 1121,
		/** Значение не может быть пустым. */
		ArgumentNullOrEmpty = 2001,
		/** Значение не попадает в поддерживаемый диапазон. */
		ArgumentOutOfRange = 2002,
		/** Неверный формат данных. */
		InvalidFormat = 3001,
		/** Неверный тип файла. */
		InvalidFileType = 3002,
		/** Неверный тип содержимого. */
		InvalidContentType = 3003,
		/** Преобразование невозможно. */
		InvalidCast = 3004,
		/** Неверное значение. */
		InvalidValue = 3005,
		/** Данные не найдены. */
		DataNotFound = 3101,
		/** Тип содержимого не найден. */
		ContentTypeNotFound = 3102,
		/** Внешняя служба не доступна или не отвечает. */
		ExternalServiceIsNotAvailable = 5000,
		/** Внешняя служба вернула ошибку. */
		ExternalServiceError = 5001,
	};

	/** Да, нет или всё, что угодно. */
	export enum yesNoAny {
		Any = 0,
		Yes = 1,
		No = 2
	}

}
 
function fox(selector: string, options?: any): foxtools.lib {
	return new foxtools.lib(selector, options);
}

// альтернатива $(document).ready
if (document.addEventListener) {
	document.addEventListener('DOMContentLoaded', foxtools.lib.ready);
}
else if (document.attachEvent) {
	window.attachEvent("onload", foxtools.lib.ready);
}