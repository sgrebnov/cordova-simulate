/*
 *
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * 'License'); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * 'AS IS' BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
 */
 
// https://github.com/apache/cordova-plugin-globalization/

var cordova = require('cordova');
var moment = require('./moment');
var GlobalizationError = require('./GlobalizationError');

var languages = [
    'English',
    'English (Canadian)',
    'French',
    'French (Canadian)',
    'German',
    'Русский'
];

var locales = [
    'en-US',
    'en-CA',
    'fr-FR',
    'fr-CA',
    'de-DE',
    'ru-RU'
];

var daysOfTheWeek = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
];

function initialize () {
    var localeList = document.querySelector('#locale-list');
    var dayList = document.querySelector('#day-list');

    languages.forEach(function (locale) {
        var option = document.createElement('option');
        option.value = locale;
        var caption = document.createTextNode(locale);
        option.appendChild(caption);
        localeList.appendChild(option);
    });

    daysOfTheWeek.forEach(function (day) {
        var option = document.createElement('option');
        option.value = day;
        var caption = document.createTextNode(day);
        option.appendChild(caption);
        dayList.appendChild(option);
    });
}

function getLocaleName () {
    var localeList = document.querySelector('#locale-list');
    var selectedLocale = locales[localeList.selectedIndex];
    return selectedLocale;
}

function getLocaleNameHandle (win, lose) {
    win({value: getLocaleName()});
}

function isDayLightSavingsTime (win, lose) {
    var daylightCheckbox = document.querySelector('#is-daylight-checkbox');
    win({dst: daylightCheckbox.checked});
}

function getFirstDayOfWeek (win, lose) {
    var daysOfWeekList = document.querySelector('#day-list');
    var selectedDay = daysOfTheWeek[daysOfWeekList.selectedIndex];
    win({value: selectedDay});
}

// HELPER FUNCTIONS

function convertToIntlNumberFormatOptions(options) {
    switch (options.type) {
        case 'decimal':
            return { style: 'decimal' };
        case 'currency':
            throw '\'currency\' number type is not supported';
        case 'percent':
            return { style: 'percent' };
        default:
            throw 'The options.type can be \'decimal\', \'percent\' or \'currency\'';
    }
}


function getWeekDayNames(locale, options) {
    var result = [];
    for (var i = 0; i < 7; i++) {
        var date = new Date(2014, 5, i + 1, 0, 0, 0, 0);
        result[i] = date.toLocaleDateString(locale, options);
    }
    return result;
}

function convertToMomentLocalizedFormat(options) {
    var selectorError = 'The options.selector can be \'date\', \'time\' or \'date and time\'';
    var formatLengthError = 'The options.formatLength can be \'short\', \'medium\', \'long\', or \'full\'';

    switch (options.formatLength) {
        case 'short':
            switch(options.selector) {
                case 'date and time': return 'lll';
                case 'date': return 'l';
                case 'time': return 'LT';
                default:
                    throw selectorError;
            }
            break;
        case 'medium':
            switch(options.selector) {
                case 'date and time': return 'LLL';
                case 'date': return 'L';
                case 'time': 
                    throw '\'time\' selector does not support \'medium\' formatLength';
                default:
                    throw selectorError;
            }
            break;
        case 'long':
            switch(options.selector) {
                case 'date and time': return 'llll';
                case 'date': return 'll';
                case 'time': 
                    throw '\'time\' selector does not support \'long\' formatLength';
                default:
                    throw selectorError;
            }
            break;
        case 'full':
            switch(options.selector) {
                case 'date and time': return 'LLLL';
                case 'date': return 'LL';
                case 'time': return 'LTS';
                default:
                    throw selectorError;
            }
            break;
        default:
            throw formatLengthError;
    }
}

function prepareAndGetDateOptions(options) {
    options = options || {formatLength:'short', selector:'date and time'};
    options.formatLength = options.formatLength || 'short';
    options.selector = options.selector || 'date and time';

    return convertToMomentLocalizedFormat(options);
}

function dstOffsetAbs(date) {
    var janOffset = new Date(date.getFullYear(), 0, 20).getTimezoneOffset();
    var julOffset = new Date(date.getFullYear(), 6, 20).getTimezoneOffset();
    if (janOffset < 0) { janOffset = -janOffset; }
    if (julOffset < 0) { julOffset = -julOffset; }
    var offset =  janOffset - julOffset;
    if (offset < 0) { offset = -offset; }
    return offset;
}

// HANDLER FUNCTIONS

function numberToString (win, fail, service, action, args) {
    try {
        var options = args[0].options || { type : 'decimal' };
        options.type = options.type || 'decimal';

        options = convertToIntlNumberFormatOptions(options);

        var formatter = new Intl.NumberFormat(getLocaleName(), options);
        win( { value: formatter.format(args[0].number) });
    } catch (e) {
        fail(new GlobalizationError(GlobalizationError.FORMATTING_ERROR, 
            e.hasOwnProperty('message')? e.message : e));
    }
}

function getDateNames (win, fail, service, action, args) {
    try {
        var options = args[0].options || { type: 'wide', item: 'months' };
        var type = options.type || 'wide';
        var item = options.item || 'item';

        var locale = getLocaleName();

        if (item === 'months' && type === 'wide') {
            options = { month: 'long' };
        } else if (item === 'months' && type === 'narrow') {
            options = { month: 'short'};
        } else if (item === 'days' && type === 'wide') {
            options = { weekday: 'long'};
        } else if (item === 'days' && type === 'narrow') {
            options = { weekday: 'short'};
        } else {
            throw 'Incorrect type or item';
        }

        var result = [];
        if (item === 'months') {
            for (var i = 0; i < 12; i++) {
                var date = new Date(2014, i, 20, 0, 0, 0, 0);
                result[i] = date.toLocaleDateString(locale, options);
            }
        } else {
            result = getWeekDayNames(locale, options);
        }

        win({ value: result });
    } catch (e) {
        fail({ code: 0, message: e.hasOwnProperty('message')? e.message : e });
    }
}

function getDatePattern (win, fail) {
    try {
      var formatter = new Intl.DateTimeFormat(getLocaleName());
      var timezone = formatter.hasOwnProperty('resolved') ? formatter.resolved.timeZone : '';
      var dstOffset = dstOffsetAbs(new Date());

      win( { 
            utc_offset: new Date().getTimezoneOffset() * (-60),
            dst_offset: dstOffset * 60,
            timezone: timezone,
            pattern: '',
           });
    } catch (e) {
        fail(new GlobalizationError(GlobalizationError.PATTERN_ERROR, 
            e.hasOwnProperty('message')? e.message : e));
    }
}

function getNumberPattern (win, fail, service, action, args) {
    try {
        var options = args[0].options || { type : 'decimal'};
        options.type = options.type || 'decimal';

        options = convertToIntlNumberFormatOptions(options);

        var formatter = new Intl.NumberFormat(getLocaleName, options);

        if (!formatter.hasOwnProperty('resolved')) { fail('Not supported'); return; }
        var pattern = formatter.resolved.pattern;
        win( { 
            pattern: pattern,
            symbol: '',
            fraction: 0,
            rounding: 0,
            positive: '',
            negative: '',
            decimal: '',
            grouping: '',
        });
    } catch (e) {
        fail(new GlobalizationError(GlobalizationError.PATTERN_ERROR, 
            e.hasOwnProperty('message')? e.message : e));
    }
}

function getCurrencyPattern (win, fail, service, action, args) {
    fail('Not supported');
}

function stringToDate (win, fail, service, action, args) {
    try {
        var options = prepareAndGetDateOptions(args[0].options);
        moment.locale(getLocaleName());

        var date = moment(args[0].dateString, options).toDate();

        win({ 
            year: date.getFullYear(), 
            month: date.getMonth(), 
            day: date.getDate(),
            hour: date.getHours(), 
            minute: date.getMinutes(), 
            second: date.getSeconds(),
            millisecond: date.getMilliseconds()
        });
    } catch (e) {
        fail(new GlobalizationError(GlobalizationError.PARSING_ERROR, 
                e.hasOwnProperty('message')? e.message : e));
    }
}

function stringToNumber (win, fail, service, action, args) {
    fail('Not supported');
}

function dateToString (win, fail, service, action, args) {
    try {
        var date = new Date(args[0].date);
        var options = prepareAndGetDateOptions(args[0].options);
        moment.locale(getLocaleName());

        win({ value : moment(date).format(options)});
    } catch (e) {
        fail(new GlobalizationError(GlobalizationError.FORMATTING_ERROR, 
                e.hasOwnProperty('message')? e.message : e));
    }
}

cordova.registerPluginHandlers(
    {
        'Globalization.getLocaleName': getLocaleNameHandle,
        'Globalization.getPreferredLanguage': getLocaleNameHandle,
        'Globalization.isDayLightSavingsTime': isDayLightSavingsTime,
        'Globalization.getFirstDayOfWeek': getFirstDayOfWeek,
        'Globalization.numberToString': numberToString,
        'Globalization.getCurrencyPattern': getCurrencyPattern, // NOT SUPPORTED
        'Globalization.dateToString': dateToString,
        'Globalization.stringToDate': stringToDate,
        'Globalization.getDatePattern': getDatePattern, // HALF SUPPORTED (see Browser Quirks)
        'Globalization.getDateNames': getDateNames,
        'Globalization.stringToNumber': stringToNumber, // NOT SUPPORTED
        'Globalization.getNumberPattern': getNumberPattern, // HALF SUPPORTED (see Browser Quirks)
    });

module.exports = {
    initialize: initialize
};
