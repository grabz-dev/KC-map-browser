define({
    /**
     * Convert a Uint8Array buffer into a string.
     * @param {Uint8Array} buffer
     * @returns {string} 
     */
    arrayBufferToString: function(buffer) {
        var bufView = new Uint16Array(buffer);
        var length = bufView.length;
        var result = '';
        var addition = Math.pow(2,16)-1;
    
        for(var i = 0;i<length;i+=addition){
    
            if(i + addition > length){
                addition = length - i;
            }
            result += String.fromCharCode.apply(null, bufView.subarray(i,i+addition));
        }
    
        return result;
    
    },
    /**
     * Provided a value in milliseconds, returns formatted time left.
     * @param {number} s - Milliseconds. 
     * @returns {string}
     */
    msToTime: function(s) {
        var ms = s % 1000;
        s = (s - ms) / 1000;
        var secs = s % 60;
        s = (s - secs) / 60;
        var mins = s % 60;
        var hrs = (s - mins) / 60;
      
        return (hrs>0?((hrs<10?"0"+hrs:hrs) + ':'):'') + (mins<10?"0"+mins:mins) + ':' + (secs<10?"0"+secs:secs);
    },
    /**
     * Checks if the provided value is numeric - valid number and not infinite.
     * @param {any} n
     * @returns {boolean} 
     */
    isNumeric: function(n) {
        n = Number(n);
        return !Number.isNaN(n) && Number.isFinite(n);
    }
});