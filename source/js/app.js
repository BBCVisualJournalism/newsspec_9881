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
        var slide = slides['slide-' + number],
            content = slide['content'],
            title = slide['title'],
            subtitle = slide['subtitle'],
            options = this.createOptions(slide['options']),
            html = '<div class="slide new">';

        if (title !== '') html +=  '<h2>' + title + '</h2>';
        if (content !== '') html += '<p>' + content + '</p>';
        if (subtitle !== '') html += '<h3>' + subtitle + '</h3>';
        if (options !== '') html += options + '<hr>';

        html += '</div>';

        this.count++;

        return html;
    };

    createOptions = function(optionsNode) {
        var options = '<div>';

        for (var i in optionsNode) {
            options += '<div class="option-wrapper" data-slide-number="' + optionsNode[i].number + '"><div class="option">' + optionsNode[i].label + '</div>';
            if (optionsNode[i].description !== '') options += '<div class="description">' + optionsNode[i].description + '</div>';
            options += '</div>';
        }

        options += '</div>';

        if (optionsNode['a'].label === '') options = '';

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

        news.$('.sidebar').find('li.step-' + this.count).attr('class', 'on step-' + this.count);
    };

    updateNavigatorNext = function() {
        news.$('.sidebar').find('circle.step-' + (this.count + 1)).attr('class', 'next step-' + (this.count + 1));
        news.$('.sidebar').find('path.trail.step-' + (this.count + 1)).attr('class', 'trail next step-' + (this.count + 1));
        news.$('.sidebar').find('path.step-' + (this.count + 1)).not('.trail').attr('class', 'next step-' + (this.count + 1));

        news.$('.sidebar').find('li.step-' + (this.count + 1)).attr('class', 'next step-' + (this.count + 1));
    };

    heightPair = function() {
        var $slide = news.$('.slide.new'),
            $descriptions = $slide.find('.description');

        $descriptions.each(function () {
            var $currentItem = news.$(this),
                $previousItem = news.$(this).closest('.option-wrapper').prev().find('.description');

            if ($currentItem.height() < $previousItem.height()) {
                $currentItem.height($previousItem.height());
            } else {
                $previousItem.height($currentItem.height());
            }
        })
    };

    sidebarPair = function() {
        news.$('.sidebar').height(news.$('.sidebar').height() + 62);
    };

    createEventListeners = function() {
        var that = this;

        news.pubsub.on('slide:created', function () {
            that.bindOptions();
            that.updateNavigator();
            that.heightPair();
            that.sidebarPair();
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
        updateNavigatorNext: updateNavigatorNext,
        heightPair: heightPair,
        sidebarPair: sidebarPair
    }

});
