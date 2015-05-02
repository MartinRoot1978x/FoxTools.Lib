/*! Хитрая (клиентская) библиотека для работы с не менее Хитрым API v2.0
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
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var foxtools;
(function (foxtools) {
    /** Статичный класс хитрых настроек хитрой библиотеки. */
    var config = (function () {
        function config() {
        }
        config.tokenCookieName = 'foxtoken';

        config.requestBaseUrl = '{0}://api.foxtools.ru/v2/{1}';

        config.useSsl = false;
        return config;
    })();
    foxtools.config = config;

    /** Представляет процесс выполнения запроса. */
    var requestProcess = (function () {
        function requestProcess() {
            /** Маркер доступа, либо адрес для получения маркера доступа. */
            this.token = null;
        }
        return requestProcess;
    })();
    foxtools.requestProcess = requestProcess;

    /** Представляет базовый класс результата выполнения запроса. */
    var baseResult = (function () {
        /**
        * Инициализирует новый экземпляр baseResult.
        * @param t Тип запроса.
        */
        function baseResult(t) {
            /** Системные сообщения. */
            this.messages = new Array();
            /** Детали выполнения запроса, если параметр details (при запросе) был равен true. */
            this.trace = new Array();
            if (t === undefined || t === null || t === '') {
                throw new Error('Type is required.');
            }
            this.type = t;
        }
        baseResult.prototype.addTrace = function (message, elepsedTime) {
            this.trace.push(new traceItem(message, elepsedTime));
        };

        baseResult.prototype.addMessage = function (type, text) {
            this.messages.push(new messageItem(type, text));
        };
        return baseResult;
    })();
    foxtools.baseResult = baseResult;

    /** Вспомогательный метод для отправки запросов к хитрому API v2.0. */
    function api(selector, options) {
        return new lib(selector, options);
    }
    foxtools.api = api;

    /** Основной класс для работы с хитрым API v2.0. */
    var lib = (function () {
        function lib(selector, options) {
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
        lib.prototype.getToken = function (url, options) {
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
                            } else if (result.value !== undefined && result.value !== null && typeof result.value == 'string') {
                                result = result.value;
                            } else if (result.data !== undefined && result.data !== null && typeof result.data == 'string') {
                                result = result.data;
                            } else {
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
        };

        /** Вызывается при загрузке документа. */
        lib.ready = function () {
            utility.initYa();
        };
        return lib;
    })();
    foxtools.lib = lib;

    /** Представляет аргументы события начала выполнения запроса. */
    var beginRequest = (function () {
        function beginRequest(request, token, data) {
            /** Ссылка на запрос, который будет выполняться. */
            this.request = null;
            /** Маркер доступа, который будет использоваться. */
            this.token = null;
            /** Указываает на необходимость отмены выполнение запроса. */
            this.cancel = false;
            /** Параметры, которые будут отправлены. */
            this.data = null;
            this.request = request;
            this.token = token;
            this.data = data;
        }
        return beginRequest;
    })();
    foxtools.beginRequest = beginRequest;

    /** Представляет хитрый запрос к API из формы. */
    var formRequest = (function (_super) {
        __extends(formRequest, _super);
        function formRequest(form) {
            _super.call(this);
            this.form = null;

            this.form = form;
        }
        /** Отправляет форму. */
        formRequest.prototype.submit = function () {
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
                    complete: function (result) {
                        if (result.type == 'errorResult') {
                            throw new Error(result.getText());
                        } else {
                            // используем полученный маркер для выполнения запроса
                            token.value = result.value;
                            $request.justSubmit(token);
                        }
                    }
                });
            } else {
                // адреса нет, либо есть маркер, просто выполняем запрос
                $request.justSubmit(token);
            }
        };

        /**
        * Просто асинхронно отправляет форму.
        * @param token Маркер доступа, который следует использовать для запроса.
        */
        formRequest.prototype.justSubmit = function (token) {
            var $request = this;
            var form = $request.form;
            var $form = $($request.form);

            var enctype = null;
            var type = $form.attr('method') || 'GET';

            if ($('input[type=file]', form).length > 0) {
                type = 'POST';
                enctype = 'multipart/form-data';
            }

            if (type.toUpperCase() == 'POST' && !enctype) {
                enctype = 'application/x-www-form-urlencoded';
            }

            var data = null;

            if (type.toUpperCase() == 'POST' && enctype == 'multipart/form-data') {
                data = new FormData(form);
            } else {
                data = $form.serialize();
            }

            var headers = null;

            // маркер доступа, если указан
            if (token !== null && token.value !== null && token.value != '') {
                headers = { Authorization: 'Bearer ' + token.value };
            }

            var methodName = $($form.attr('action').split('/')).last()[0].toString();
            methodName = (methodName.indexOf('?') != -1 ? methodName.substr(0, methodName.indexOf('?')) : methodName);

            // если есть обработчик, делаем событие begin
            if ($request.begin !== undefined && $request.begin !== null && typeof $request.begin === 'function') {
                var eventData = new beginRequest($request, token, data);
                $request.begin(eventData);

                // запрос отменен
                if (eventData.cancel) {
                    return;
                }
                data = eventData.data;
            }

            // --
            utility.yah($form.attr('action'), methodName);

            $.ajax({
                type: type,
                enctype: enctype,
                url: $form.attr('action'),
                data: data,
                dataType: 'json',
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
                    var r = new result(methodName, x.status, errorThrown, $.parseJSON(x.responseText || errorThrown));

                    // смотрим, если ошибка связана с маркером доступа
                    if (r.data.type == 'errorResult' && $.grep(r.data.items, function (error) {
                        return error.code == 1110 /* AccessTokenError */ || error.code == 1111 /* AccessTokenNotFound */ || error.code == 1112 /* NoPermissionToUseTokenForCurrentIp */;
                    }).length > 0) {
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
        };
        return formRequest;
    })(requestProcess);
    foxtools.formRequest = formRequest;

    /** Представляет хитрый запрос к хитрому API. */
    var request = (function (_super) {
        __extends(request, _super);
        function request(methodName) {
            _super.call(this);
            /** Базовый адрес, из которого формируется конечный адрес, на который будет отправлен запрос. */
            this.baseUrl = config.requestBaseUrl;
            /** Использовать защищенное соединение или нет (пока не используется, нет нормального сертификата). */
            this.useSsl = config.useSsl;
            /**
            * Метод, который следует использовать для запроса: GET или POST.
            * Может быть определен автоматически, в зависимости от параметров запроса.
            */
            this.type = 'GET';
            /** Итоговый адрес, на который будет отправлен запрос (формируется автоматически). */
            this.endpoint = '';
            /** Название метода, который следует выполнить. */
            this.methodName = '';

            if (methodName === undefined || methodName === null) {
                throw new Error('Method name is required. Please add method name to request:\r\n' + 'You can find a list of methods on the page: http://api.foxtools.ru/v2');
            }

            this.methodName = methodName;
            this.endpoint = utility.format(this.baseUrl, [(this.useSsl ? 'https' : 'http'), methodName]);
            this.parameters = new httpParameterCollection();
        }
        /** Выполняет запрос к API. */
        request.prototype.execute = function () {
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
                    complete: function (result) {
                        if (result.type == 'errorResult') {
                            throw new Error(result.getText());
                        } else {
                            // используем полученный маркер для выполнения запроса
                            token.value = result.value;
                            $request.justExecute(token);
                        }
                    }
                });
            } else {
                // адреса нет, либо есть маркер, просто выполняем запрос
                $request.justExecute(token);
            }
        };

        /**
        * Совершенно точно и без лишних вопросов выполняет хитрый запрос к хитрому API.
        * @param token Маркер доступа, который следует использовать при отправке запроса.
        */
        request.prototype.justExecute = function (token) {
            var $request = this;

            // определяем тип запроса и тип содержимого
            var enctype = null;
            var type = $request.type || 'GET';

            if ($request.parameters.hasFiles) {
                type = 'POST';
                enctype = 'multipart/form-data';
            }

            if (type.toUpperCase() == 'POST' && !enctype) {
                enctype = 'application/x-www-form-urlencoded';
            }

            // если указан маркер доступа, используем его для данного запроса
            var headers = null;
            if (token !== null && token.value !== null && token.value != '') {
                headers = { Authorization: 'Bearer ' + token.value };
            }

            var data = (type == 'GET' ? $.param($request.parameters.toParams()) : $request.parameters.toParams());

            // если есть обработчик, делаем событие begin
            if ($request.begin !== undefined && $request.begin !== null && typeof $request.begin === 'function') {
                var eventData = new beginRequest($request, token, data);
                $request.begin(eventData);

                // запрос отменен
                if (eventData.cancel) {
                    return;
                }
                data = eventData.data;
            }

            utility.yah($request.endpoint, $request.methodName);

            $.ajax({
                url: $request.endpoint,
                enctype: enctype,
                type: type,
                //dataType: 'jsonp',
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
                // beforeSend: function (x) { },
                success: function (r) {
                    if ($request.complete !== undefined && $request.complete !== null && typeof $request.complete === 'function') {
                        $request.complete(new result($request.methodName, 200, null, r));
                    } else {
                        new result($request.methodName, 200, null, r);
                    }
                },
                error: function (x, textStatus, errorThrown) {
                    var r = new result($request.methodName, x.status, errorThrown, $.parseJSON(x.responseText || errorThrown));

                    // смотрим, если ошибка связана с маркером доступа
                    if (r.data.type == 'errorResult' && $.grep(r.data.items, function (error) {
                        return error.code == 1110 /* AccessTokenError */ || error.code == 1111 /* AccessTokenNotFound */ || error.code == 1112 /* NoPermissionToUseTokenForCurrentIp */;
                    }).length > 0) {
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
        };
        return request;
    })(requestProcess);
    foxtools.request = request;

    /** Представляет коллекцию параметров запроса. */
    var httpParameterCollection = (function () {
        function httpParameterCollection() {
            this.items = new Array();
        }
        /**
        * Добавляет параметр в коллекцию.
        * @param name Имя параметра, либо элемент.
        * @param value Значение параметра.
        */
        httpParameterCollection.prototype.add = function (name, value) {
            this.items.push(new httpParameter(name, value));
        };

        /** Возвращает параметры в виде объекта для выполнения запроса. */
        httpParameterCollection.prototype.toParams = function () {
            var result = null;

            // смотрим, если есть файлы, то делаем FormData
            var hasFiles = this.hasFiles;
            if (hasFiles) {
                result = new FormData();
            } else {
                result = new Object();
            }

            for (var i = 0; i <= this.items.length - 1; i++) {
                if (hasFiles) {
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

            return result;
        };

        Object.defineProperty(httpParameterCollection.prototype, "hasFiles", {
            /** Возвращает true, если в коллекции есть файлы.*/
            get: function () {
                return $.grep(this.items, function (item) {
                    if (item.isFile) {
                        return true;
                    }
                }).length > 0;
            },
            enumerable: true,
            configurable: true
        });
        return httpParameterCollection;
    })();
    foxtools.httpParameterCollection = httpParameterCollection;

    /** Представляет один единственный параметр запроса. */
    var httpParameter = (function () {
        /**
        * Создает новый параметр.
        * @param name Имя параметра или элемент.
        * @param value Значение параметра.
        */
        function httpParameter(name, value) {
            /** Содержит значение true, если параметр является файлом. */
            this.isFile = false;
            // проверяем наличие имени
            if (name === undefined || name === null) {
                throw new Error('Name is required.');
            }

            // проверяем, что указано в имени
            if (utility.isElement(name)) {
                // элемент формы
                this.name = $(name).attr('name');
                this.setValue(name);
                ;
            } else if (utility.isJqueryObject(name)) {
                // объект jquery
                if (name.length) {
                    this.name = name.attr('name');
                    this.setValue(name);
                } else {
                    throw new Error('jQuery object can not be empty.');
                }
            } else {
                this.name = name;
                this.setValue(value);
            }
        }
        /**
        * Задает значение параметра в правильном виде.
        * @param value Значение, которое нужно преобразовать в правильный вид.
        */
        httpParameter.prototype.setValue = function (value) {
            if (utility.isElement(value)) {
                // элемент формы, делаем объект jQuery
                value = $(value);
            } else if (utility.isJqueryObject(value)) {
                // объект jQuery, проверяем наличие элемента
                if (!value.length) {
                    throw new Error('jQuery object can not be empty.');
                }
            } else {
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
        };
        return httpParameter;
    })();
    foxtools.httpParameter = httpParameter;

    /** Представляет результат выполнения запроса к API. */
    var result = (function () {
        function result(methodName, statusCode, errorThrown, data) {
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
            } else {
                this.data = new stringResult(data);
                return;
            }

            // есть информация об ошибках
            if (data.errors !== undefined && data.errors !== null) {
                this.data = new errorResult(data.errors);
            } else {
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

                    case 'machinekey':
                    case 'stat':
                    case 'textdecoder':
                    case 'translator':
                    case 'weather':
                    case 'webconverter':
                    case 'eventlogger':
                        this.data = data;
                        break;

                    case 'pwd':
                    case 'guid':
                    case 'idn':
                    case 'randomkey':
                        this.data = new stringArrayResult(data);
                        break;

                    default:
                        this.data = new stringResult(data.value);
                        break;
                }
            }

            if (data.messages !== undefined && data.messages !== null) {
                for (var i = 0; i <= data.messages.length - 1; i++) {
                    this.data.addMessage(data.messages[i].type, data.messages[i].text);
                }
            }

            if (data.trace !== undefined && data.trace !== null) {
                for (var i = 0; i <= data.trace.length - 1; i++) {
                    this.data.addTrace(data.trace[i].message, data.trace[i].elapsedTime);
                }
            }
        }
        Object.defineProperty(result.prototype, "isError", {
            /** Возвращает true, если текущий результат содержит информацию об ошибках. */
            get: function () {
                return this.data.type === 'errorResult';
            },
            enumerable: true,
            configurable: true
        });

        /** Возвращает строковое значение результата выполнения запроса к API. */
        result.prototype.toString = function () {
            return this.data.toString();
        };
        return result;
    })();
    foxtools.result = result;

    /** Представляет информацию об ошибке при выполнении запроса к API. */
    var errorResult = (function (_super) {
        __extends(errorResult, _super);
        function errorResult(errors) {
            _super.call(this, 'errorResult');
            this.items = new Array();

            if (errors !== undefined && errors !== null) {
                for (var i = 0; i <= errors.length - 1; i++) {
                    //errors[i].charAt(0).toUpperCase() + errors[i].code.slice(1)
                    this.add(errorCode[errors[i].code], errors[i].text);
                }
            }
        }
        /**
        * Добавляет сообщение об ошибке в коллекцию.
        * @param code Код ошибки.
        * @param text Текст сообщения.
        */
        errorResult.prototype.add = function (code, text) {
            this.items.push(new errorMessage(code, text));
        };

        /** Возвращает текст всех ошибок, находящихся в текущем экземпляре объекта. */
        errorResult.prototype.toString = function () {
            return this.getText();
        };

        errorResult.prototype.getText = function () {
            var errorMessage = '';
            for (var i = 0; i <= this.items.length - 1; i++) {
                if (errorMessage.length > 0) {
                    errorMessage += '\n';
                }
                errorMessage += this.items[i].text;
            }
            return errorMessage;
        };
        return errorResult;
    })(baseResult);
    foxtools.errorResult = errorResult;

    /** Представляет сообщение об ошибке. */
    var errorMessage = (function () {
        /**
        * Создает новый экземпляр класса errorMessage.
        * @param code Код ошибки.
        * @param text Текст сообщения.
        */
        function errorMessage(code, text) {
            this.code = code;
            this.text = text;
        }
        return errorMessage;
    })();
    foxtools.errorMessage = errorMessage;

    /** Представляет системное сообщение. */
    var messageItem = (function () {
        /**
        * Создает новый экземпляр класса messageItem.
        * @param type Тип сообщения.
        * @param text Текст сообщения.
        */
        function messageItem(type, text) {
            this.type = type;
            this.text = text;
        }
        return messageItem;
    })();
    foxtools.messageItem = messageItem;

    /** Представляет элемент детальной информации о выполнении запроса. */
    var traceItem = (function () {
        function traceItem(message, elapsedTime) {
            this.message = message;
            this.elapsedTime = elapsedTime;
        }
        /** Возвращает строковое представление текущего экземпляра объекта. */
        traceItem.prototype.toString = function () {
            return this.elapsedTime + '> ' + this.message;
        };
        return traceItem;
    })();
    foxtools.traceItem = traceItem;

    /** Представляет строковой результат выполнения запроса к API. */
    var stringResult = (function (_super) {
        __extends(stringResult, _super);
        /**
        * Создает новый экземпляр класса stringResult.
        * @param value Строковое значение результата выполнения запроса к API.
        */
        function stringResult(value) {
            _super.call(this, 'stringResult');
            this.value = value;
        }
        /** Возвращает строковое значение результата выполнения запроса к API. */
        stringResult.prototype.toString = function () {
            return this.value;
        };
        return stringResult;
    })(baseResult);
    foxtools.stringResult = stringResult;

    /** Представляет строковой массив. */
    var stringArrayResult = (function (_super) {
        __extends(stringArrayResult, _super);
        /**
        * Создает новый экземпляр класса stringArrayResult.
        * @param data Результат выполнения запроса к API.
        */
        function stringArrayResult(data) {
            _super.call(this, 'stringArrayResult');
            /** Элементы коллекции. */
            this.items = new Array();
            /** Номер текущей страницы. */
            this.pageNumber = 0;
            /** Общее количество страниц. */
            this.pageCount = 0;
            this.items = data.items;
            this.pageNumber = data.pageNumber;
            this.pageCount = data.pageCount;
        }
        return stringArrayResult;
    })(baseResult);
    foxtools.stringArrayResult = stringArrayResult;

    /** Представляет результат расчета хеш-суммы. */
    var hashResult = (function (_super) {
        __extends(hashResult, _super);
        function hashResult(items) {
            _super.call(this, 'hashResult');
            /** Список полученных хеш-сумм. */
            this.items = new Array();

            if (items !== undefined && items !== null) {
                for (var i = 0; i <= items.length - 1; i++) {
                    this.add(items[i].code, items[i].text);
                }
            }
        }
        /**
        * Добавляет элемент в коллекцию.
        * @param type Алгоритм.
        * @param value Хеш-сумма.
        */
        hashResult.prototype.add = function (type, value) {
            this.items.push(new hashItem(type, value));
        };
        return hashResult;
    })(baseResult);
    foxtools.hashResult = hashResult;

    /** Элемент результата расчета хеш-суммы. */
    var hashItem = (function () {
        function hashItem(type, value) {
            this.type = type;
            this.value = value;
        }
        return hashItem;
    })();
    foxtools.hashItem = hashItem;

    /** Представляет результат выполнения запроса информации об IP. */
    var ipResult = (function (_super) {
        __extends(ipResult, _super);
        function ipResult(data) {
            _super.call(this, 'ipResult');
            /** Индикатор указывает, является адрес IP прокси-сервером или нет. */
            this.proxy = false;
            /** Информация о стране, которой принадлежит адрес. */
            this.country = null;
            /** Информация о городе, которому принадлежит адрес. */
            this.city = null;
            this.ip = data.ip;
            this.proxy = data.proxy;
            this.country = data.country || null;
            this.city = data.city || null;
        }
        return ipResult;
    })(baseResult);
    foxtools.ipResult = ipResult;

    /** Представляет информацию о стране. */
    var countryResult = (function (_super) {
        __extends(countryResult, _super);
        function countryResult() {
            _super.apply(this, arguments);
            this.nameEn = null;
            this.nameRu = null;
            this.domain = null;
            this.domainNational = null;
            this.fips10 = null;
            this.id = null;
            this.ioc = null;
            this.iso3166a2 = null;
            this.iso3166a3 = null;
            this.iso3166num = null;
            this.itu = null;
            this.phoneCode = null;
            this.stanag = null;
            this.un = null;
            this.unIso = null;
        }
        return countryResult;
    })(baseResult);
    foxtools.countryResult = countryResult;

    /** Представляет информацию о городе. */
    var cityResult = (function (_super) {
        __extends(cityResult, _super);
        function cityResult() {
            _super.apply(this, arguments);
            this.nameEn = null;
            this.nameRu = null;
            this.zip = null;
            this.metroCode = null;
            this.areaCode = null;
            this.longitude = null;
            this.latitude = null;
        }
        return cityResult;
    })(baseResult);
    foxtools.cityResult = cityResult;

    /** Представляет результат обращения за списком прокси-серверов. */
    var proxyResult = (function (_super) {
        __extends(proxyResult, _super);
        function proxyResult(data) {
            _super.call(this, 'proxyResult');
            /** Номер текущей страницы. */
            this.pageNumber = 0;
            /** Общее количество страниц. */
            this.pageCount = 0;
            /** Список полученных прокси-серверов. */
            this.items = new Array();

            this.pageNumber = data.pageNumber;
            this.pageCount = data.pageCount;

            if (data.items !== undefined && data.items !== null) {
                for (var i = 0; i <= data.items.length - 1; i++) {
                    this.add(data.items[i]);
                }
            }
        }
        proxyResult.prototype.add = function (proxy) {
            this.items.push(proxy);
        };
        return proxyResult;
    })(baseResult);
    foxtools.proxyResult = proxyResult;

    /** Представляет прокси-сервер, полученный из хитрого хранилища. */
    var proxyItem = (function () {
        function proxyItem() {
            /** Адрес прокси-сервера. */
            this.ip = '';
            /** Статус доступности прокси-сервера. */
            this.available = 0 /* Any */;
            /** Бесплатность прокси-сервера. */
            this.free = 0 /* Any */;
            /** Информация о стране, в которой расположен прокси-сервер. */
            this.country = null;
        }
        return proxyItem;
    })();
    foxtools.proxyItem = proxyItem;

    /** Представляет хитрый маркер доступа. */
    var foxtoolsToken = (function () {
        function foxtoolsToken() {
            /** Маркер доступа. */
            this.value = null;
            /** Адрес, который может вернуть новый маркер доступа (адрес на вашем сервере). */
            this.url = null;
            /**
            * Число ошибок, которые возникли при получении маркера доступа.
            * Технический параметр, меняется автоматически.
            */
            this.errors = 0;
        }
        return foxtoolsToken;
    })();
    foxtools.foxtoolsToken = foxtoolsToken;

    /** Вспомогательные полезняшки. */
    var utility = (function () {
        function utility() {
        }
        /**
        * Форматирует указанную строку.
        * @param value Строка, в которую следует вставить параметры.
        * @param args Пермеаметры, которые следует вставить в строку.
        */
        utility.format = function (value, args) {
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
        };

        /** Делает куку. */
        utility.createCookies = function (name, value, days) {
            var expires = '';
            var date = new Date();

            if (days !== undefined && days !== null) {
                date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
                expires = '; expires=' + date.toUTCString();
            }

            document.cookie = this.format('{name}={value}{expires}; path=/', { name: name, value: value, expires: expires });
        };

        /** Зачитывает куку вслух, с выражением, стоя на одной ноге на табуретке на кухне, в шубе и шапке ушанке, летом, ночью, в полнолуние. */
        utility.readCookies = function (name) {
            var ca = document.cookie.split(';');

            name = name + '=';

            for (var i = 0; i < ca.length; i++) {
                var c = ca[i];
                while (c.charAt(0) == ' ')
                    c = c.substring(1, c.length);
                if (c.indexOf(name) == 0)
                    return c.substring(name.length, c.length);
            }

            return null;
        };

        /** Стирает куку. */
        utility.eraseCookies = function (name) {
            utility.createCookies(name, '', -1);
        };

        /** Проверяет, является указанное значение элементом HTML или нет. */
        utility.isElement = function (element) {
            if (element === undefined || element === null) {
                return false;
            }
            return (element instanceof HTMLElement);
        };

        /** Проверяет, является указанное значение объектом jQuery или нет. */
        utility.isJqueryObject = function (element) {
            if (element === undefined || element === null) {
                return false;
            }
            return (element instanceof $);
        };

        /** Возвращает true, если браузер поддерживает работу с локальным хранилищем. */
        utility.clinetIsSupportLocalStorage = function () {
            try  {
                return 'localStorage' in window && window['localStorage'] !== null;
            } catch (ex) {
                return false;
            }
        };

        /**
        * Разбирает хитрый маркер доступа.
        * @param token Маркер доступа, который следует разобрать. Это может быть строка с маркером, либо url, либо объект.
        */
        utility.parseToken = function (token) {
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
            } else if (typeof token == 'object') {
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
                    throw new Error('Token not found.');
                }
            } else {
                throw new Error('Token value not supported.');
            }

            return result;
        };

        /**
        * Отправляет хит в Яндекс.Метрику.
        * @param url Адрес хитовой страницы.
        * @param title Заголовок хитовой страницы.
        */
        utility.yah = function (url, title) {
            try  {
                //utility.initYa();
                if (utility.yaCounter !== undefined && utility.yaCounter !== null) {
                    utility.yaCounter.hit(url, title, null);
                }
            } catch (ex) {
            }
        };

        /** Инициализирует Яндекс.Метрику. */
        utility.initYa = function () {
            try  {
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
            } catch (ex) {
            }
        };
        return utility;
    })();
    foxtools.utility = utility;

    /** Перечень режимов обработки данных. */
    (function (dataMode) {
        dataMode[dataMode["auto"] = 0] = "auto";
        dataMode[dataMode["encode"] = 1] = "encode";
        dataMode[dataMode["decode"] = 2] = "decode";
    })(foxtools.dataMode || (foxtools.dataMode = {}));
    var dataMode = foxtools.dataMode;

    /** Перечень режимов обработки данных. */
    (function (outputFormat) {
        outputFormat[outputFormat["text"] = 0] = "text";
        outputFormat[outputFormat["file"] = 1] = "file";
    })(foxtools.outputFormat || (foxtools.outputFormat = {}));
    var outputFormat = foxtools.outputFormat;

    /** Перечень ошибок, которые может вернуть API. */
    (function (errorCode) {
        errorCode[errorCode["None"] = 0] = "None";

        /** Внутренняя ошибка сервера. */
        errorCode[errorCode["InternalError"] = 1000] = "InternalError";

        /** Не поддерживается. */
        errorCode[errorCode["NotSupported"] = 1001] = "NotSupported";

        /** Не реализовано. */
        errorCode[errorCode["NotImplemented"] = 1002] = "NotImplemented";

        /** Невозможно обработать указанный тип данных. */
        errorCode[errorCode["UnableToProcessData"] = 1003] = "UnableToProcessData";

        /** Вышло время ожидания завершения операции. */
        errorCode[errorCode["Timeout"] = 1004] = "Timeout";

        /** Доступ запрещен. */
        errorCode[errorCode["AccessDenied"] = 1100] = "AccessDenied";

        /** Общая ошибка маркера доступа. */
        errorCode[errorCode["AccessTokenError"] = 1110] = "AccessTokenError";

        /** Маркер доступа не найден. */
        errorCode[errorCode["AccessTokenNotFound"] = 1111] = "AccessTokenNotFound";

        /** Нет разрешения на использования этого маркера доступа. */
        errorCode[errorCode["NoPermissionToUseTokenForCurrentIp"] = 1112] = "NoPermissionToUseTokenForCurrentIp";

        /** Адрес находится в черном списке. */
        errorCode[errorCode["AddressIsBlacklisted"] = 1121] = "AddressIsBlacklisted";

        /** Значение не может быть пустым. */
        errorCode[errorCode["ArgumentNullOrEmpty"] = 2001] = "ArgumentNullOrEmpty";

        /** Значение не попадает в поддерживаемый диапазон. */
        errorCode[errorCode["ArgumentOutOfRange"] = 2002] = "ArgumentOutOfRange";

        /** Неверный формат данных. */
        errorCode[errorCode["InvalidFormat"] = 3001] = "InvalidFormat";

        /** Неверный тип файла. */
        errorCode[errorCode["InvalidFileType"] = 3002] = "InvalidFileType";

        /** Неверный тип содержимого. */
        errorCode[errorCode["InvalidContentType"] = 3003] = "InvalidContentType";

        /** Преобразование невозможно. */
        errorCode[errorCode["InvalidCast"] = 3004] = "InvalidCast";

        /** Неверное значение. */
        errorCode[errorCode["InvalidValue"] = 3005] = "InvalidValue";

        /** Данные не найдены. */
        errorCode[errorCode["DataNotFound"] = 3101] = "DataNotFound";

        /** Тип содержимого не найден. */
        errorCode[errorCode["ContentTypeNotFound"] = 3102] = "ContentTypeNotFound";

        /** Внешняя служба не доступна или не отвечает. */
        errorCode[errorCode["ExternalServiceIsNotAvailable"] = 5000] = "ExternalServiceIsNotAvailable";

        /** Внешняя служба вернула ошибку. */
        errorCode[errorCode["ExternalServiceError"] = 5001] = "ExternalServiceError";
    })(foxtools.errorCode || (foxtools.errorCode = {}));
    var errorCode = foxtools.errorCode;
    ;

    /** Да, нет или всё, что угодно. */
    (function (yesNoAny) {
        yesNoAny[yesNoAny["Any"] = 0] = "Any";
        yesNoAny[yesNoAny["Yes"] = 1] = "Yes";
        yesNoAny[yesNoAny["No"] = 2] = "No";
    })(foxtools.yesNoAny || (foxtools.yesNoAny = {}));
    var yesNoAny = foxtools.yesNoAny;
})(foxtools || (foxtools = {}));

function fox(selector, options) {
    return new foxtools.lib(selector, options);
}

// альтернатива $(document).ready
if (document.addEventListener) {
    document.addEventListener('DOMContentLoaded', foxtools.lib.ready);
} else if (document.attachEvent) {
    window.attachEvent("onload", foxtools.lib.ready);
}
