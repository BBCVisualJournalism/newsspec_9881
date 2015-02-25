define([
    'lib/news_special/bootstrap',
    'lib/news_special/share_tools/controller',
    'data/slides'
], function (news, shareTools, slides) {

    // setTimeout(function () {
    //     news.pubsub.emit('istats', ['panel-clicked', 'newsspec-interaction', 3]);
    // }, 500);
    // setTimeout(function () {
    //     news.pubsub.emit('istats', ['quiz-end', 'newsspec-interaction', true]);
    // }, 2000);

    shareTools.init('.tempShareToolsHolder', {
        storyPageUrl: document.referrer,
        header:       'Share this page',
        message:      'Custom message',
        hashtag:      'BBCNewsGraphics',
        template:     'dropdown' // 'default' or 'dropdown'
    });

    news.sendMessageToremoveLoadingImage();

    count = 0;

    init = function() {
        var slide,
            first,
            rest;

        this.createEventListeners();

        first = this.createFirstSlide();
        rest = this.createSlide(1);

        slide = first + rest;

        news.$('.slides').append(slide);
        news.pubsub.emit('slide:created', []);
    };

    createFirstSlide = function() {
        var title = '<h2>' + slides['main-title'] + '</h2>';

        return title;
    };

    createSlide = function(number) {
        console.log('slide ' + number);
        var slide = slides['slide-' + number],
            content = slide['content'],
            subtitle = slide['subtitle'],
            options = this.createOptions(slide['options']),
            html =  '<p>' + content + '</p>' +
                    '<h3>' + subtitle + '</h3>' +
                    options + '<hr>';

        this.count++;

        return html;
    };

    createOptions = function(optionsNode) {
        var options = '<div>';

        for (var i in optionsNode) {
            options += '<div class="option-wrapper" data-slide-number="' + optionsNode[i].number + '"><div class="option">' + optionsNode[i].label + '</div>';
            options += '<div class="description">' + optionsNode[i].description + '</div></div>';
        }

        options += '</div>';

        return options;
    };

    bindOptions = function(optionsNode) {
        var that = this;

        news.$('.slides').find('.option').bind('click', function() {
            var slide = news.$(this).closest('.option-wrapper').attr('data-slide-number'),
                slideHtml = that.createSlide(slide);

            news.$('.slides').append(slideHtml);
            news.pubsub.emit('slide:created', []);
        })
    };

    updateNavigator = function() {
        news.$('.sidebar').find('circle.step-' + this.count).attr('class', 'on step-' + this.count);
        news.$('.sidebar').find('circle.step-' + (this.count + 1)).attr('class', 'next step-' + (this.count + 1));
        news.$('.sidebar').find('path.step-' + this.count).not('.trail').attr('class', 'anim step-' + this.count);
    };

    updateNavigatorNext = function() {
        news.$('.sidebar').find('circle.step-' + (this.count + 1)).attr('class', 'next step-' + (this.count + 1));
        news.$('.sidebar').find('path.trail.step-' + (this.count + 1)).attr('class', 'trail next step-' + (this.count + 1));
        news.$('.sidebar').find('path.step-' + (this.count + 1)).not('.trail').attr('class', 'next step-' + (this.count + 1));
    };

    createEventListeners = function() {
        var that = this;

        news.pubsub.on('slide:created', function () {
            that.bindOptions();
            that.updateNavigator();
        });

        $("svg path").on('animationend webkitAnimationEnd oAnimationEnd oanimationEnd MSAnimationEnd', function() {
            that.updateNavigatorNext();
    	});
    };

    return {
        count: count,
        init: init,
        createFirstSlide: createFirstSlide,
        createSlide: createSlide,
        createOptions: createOptions,
        bindOptions: bindOptions,
        createEventListeners: createEventListeners,
        updateNavigator: updateNavigator,
        updateNavigatorNext: updateNavigatorNext
    }

});
