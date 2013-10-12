(function(exports){
    var methodCalls = {},
        html = [],
        consoleLog = console.log,
        describing = false,
        correct = 0,
        incorrect = 0,
        failed = [],
        beforeCallbacks = [],
        afterCallbacks = [];

    var _expect = function(passed, msg, options){
        options = options || {}

        if(passed){
            var successMsg = "Test Passed"
            if (options.successMsg){
                successMsg += ": " + options.successMsg
            }
            write(logFilter('<div class="console-passed">') + successMsg +
                  logFilter('</div>', true), true)
            correct++
        } else {
            msg = _message(msg) || 'Invalid'
            // extra credit feature - TODO: complete
            if (options.extraCredit) {
                msg = (options.extraCredit !== true) ? _message(options.extraCredit) : null
                msg = combineMessages(["Test Missed", msg], ": ");
                write(logFilter("<div class='console-missed'>") + msg +
                      logFilter("</div>", true), true)
                incorrect++
            }
            else{
                write(logFilter("<div class='console-failed'>Test Failed: ") + msg +
                      logFilter("</div>", true), true)
                var error = new Test.Error(msg);
                if (describing){
                    failed.push(error);
                }
                else{
                    throw error;
                }
            }
        }
    }

    function logFilter( msg, lf ){
        // detect node.js
        if ( this.exports ){
            return msg;
        } else {
            var m = msg.replace( /<[^>].*>/g, '');
            // Add a LF only for empty messages that don't have the *lf* set
            return ( m.length == 0 && ( ! lf ) ) ? "" : m + "\n";
        }
    }


    function write(msg, noLineBreak){
        if ((msg.length == 0) && (! this.exports)){
            return
        }

        if (html.length == 0){
            console.log(msg);
        }
        else{
            html.push(msg);
            if(!noLineBreak){
                html.push(logFilter('<br>'));
            }
        }
    }

    function combineMessages(msgs, separator){
        return msgs.filter(function(m){return m != null;}).join(separator)
    }

    function _message(msg, prefix){

        if (typeof msg == 'function'){
            msg = msg()
        }else if (typeof msg == 'array'){
            msg = combineMessages(msg, ' - ')
        }
        return prefix ? (prefix + ' - ' + msg) : msg
    }

    function logCall(name, useConsole){
        methodCalls[name] = Test.callCount(name) + 1

        if (useConsole){
            console.log(name + " called");
        }
    }

    var Test = {
        callCount: function(name) {
            return methodCalls[name] || 0
        },
        inspect: function(obj){
            logCall('inspect')
            if(typeof obj == 'string'){
                return obj;
            } else {
                return obj && obj !== true ? JSON.stringify(obj) : ('' + obj)
            }
        },
        describe: function(msg, fn) {
            try{
                if (describing) throw "cannot call describe within another describe"
                logCall('describe')
                describing = true
                html.push(logFilter('<div class="console-describe"><h6>'));
                html.push(_message(msg))
                html.push(logFilter(':</h6>'));
                // intercept console.log messages
                console.log = write
                fn();
            }
            finally{
                html.push(logFilter('</div>'));
                // restore log
                console.log = consoleLog
                console.log(html.join(''));
                html = []
                describing = false
                beforeCallbacks = [];
                afterCallbacks = [];
                if (failed.length > 0){
                    throw failed[0];
                }
            }
        },
        it: function(msg, fn) {
            try{
                logCall('it');
                html.push(logFilter('<div class="console-it"><h6>'))
                html.push(_message(msg));
                html.push(logFilter(':</h6>'));
                beforeCallbacks.forEach(function(cb){
                    cb()
                });
                try{
                    fn();
                } finally {
                    afterCallbacks.forEach(function(cb){
                        cb()
                    });
                }
            }
            finally{
                html.push(logFilter('</div>'));
            }
        },
        before: function(cb) {
            beforeCallbacks.push(cb);
        },
        after: function(cb) {
            afterCallbacks.push(cb);
        },
        expect: function(passed, message, options){
            logCall('expect')
            _expect(passed, message, options)
        },
        assertSimilar: function(actual, expected, msg, options){
            logCall('assertSimilar')
            this.assertEquals(this.inspect(actual), this.inspect(expected), msg, options)
        },
        assertNotSimilar: function(actual, expected, msg, options){
            logCall('assertNotSimilar')
            this.assertNotEquals(this.inspect(actual), this.inspect(expected), msg, options)
        },
        assertEquals: function(actual, expected, msg, options) {
            logCall('assertEquals')
            if(actual !== expected){
                msg = _message('Expected: ' + Test.inspect(expected) + ', instead got: ' + Test.inspect(actual), msg)
                Test.expect(false, msg, options);
            }else{
                options = options || {}
                options.successMsg = options.successMsg || 'Value == ' + Test.inspect(expected)
                Test.expect(true, null, options)
            }
        },
        assertNotEquals: function(a, b, msg, options){
            logCall('assertNotEquals')
            if(a === b){
                msg = _message('Not Expected: ' + Test.inspect(a), msg)
                Test.expect(false, msg, options)
            }else{
                options = options || {}
                options.successMsg = options.successMsg || 'Value != ' + Test.inspect(b)
                Test.expect(true, null, options)
            }
        },
        expectNoError: function(msg, fn){
            logCall('expectNoError')
            if(!fn){
                fn = msg;
                msg = 'Unexpected error was raised'
            }

            try{
                fn();
                Test.expect(true)
            }catch(ex){
                if (ex.name == 'Test:Error'){
                    throw ex;
                }
                else {
                    msg += ': ' + ex.toString()
                    Test.expect(false, msg)
                }
            }
        },
        expectError: function(msg, fn, options){
            logCall('expectError')
            if(!fn){
                fn = msg;
                msg = 'Unexpected error was raised.'
            }

            var passed = false
            try{
                fn();
            }catch(ex){
                console.log(logFilter('<b>Expected error was thrown:</b> ') + ex.toString())
                passed = true
            }

            Test.expect(passed, msg, options)
        },
        randomNumber: function(){
            logCall('randomNumber');
            return Math.round(Math.random() * 100)
        },
        randomToken: function(){
            return Math.random().toString(36).substr(8)
        },
        randomize: function(array){
            logCall('randomize');
            var arr = array.concat(), i = arr.length, j, x;
            while(i) {
                j = (Math.random() * i) | 0;
                x = arr[--i];
                arr[i] = arr[j];
                arr[j] = x;
            }
            return arr;
        },
        sample: function(array){
            logCall('sample');
            return array[~~(array.length * Math.random())]
        },
        Error: function(message){
            logCall('Error');
            this.name = "Test:Error";
            this.message = (message || "");
        }
    }

    Test.Error.prototype = Error.prototype;

    Test.inspect.toString = function(){}
    Test.randomize.toString = function(){}
    Test.sample.toString = function(){}
    Test.randomNumber.toString = function(){}

    Object.freeze(Test)

    exports.Test = Test;
    exports.describe = Test.describe;
    exports.it = Test.it;
    exports.before = Test.before;
    exports.after = Test.after


})(typeof module != 'undefined' ? module.exports : this)

