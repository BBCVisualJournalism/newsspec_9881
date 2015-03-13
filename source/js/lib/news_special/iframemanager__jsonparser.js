define(function () {

    return {
        parseJSON: function (event) {
            var data = JSON.parse(event.data.split('::')[1]);
            return data;
        }
    };

});
