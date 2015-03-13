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
//    news.sendMessageToremoveLoadingImage();

    count = 0;

    init = function() {
        var slide,
            first,
            rest,
            whichIFrame = this.whichIFrame();

        if (whichIFrame !== 'sidebar') {
            this.mainSequence();
            //this.sidebarSequence();
        } else {
            this.sidebarSequence();
        }
    };

    whichIFrame = function() {
        isIFrame = news.$('.main').hasClass('second') ? 'sidebar' : 'main';

        return isIFrame;
    };

    mainSequence = function() {
        var that = this;

        shareTools.init('.tempShareToolsHolder', {
            storyPageUrl: document.referrer,
            header:       'Share this page',
            message:      'Custom message',
            hashtag:      'BBCNewsGraphics',
            template:     'dropdown' // 'default' or 'dropdown'
        });

        this.createEventListenersMain();

        first = this.createFirstSlide();
        rest = this.createSlide(1);

        slide = first + rest;

        news.$('.slides').append(slide);
        news.pubsub.emit('slide:created', [{ 'fade' : false, 'count' : that.count }]);
    };

    sidebarSequence = function() {
        this.createEventListenersSidebar();
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

        html += '</div><div class="coming-soon"></div>';

        this.count++;

        return html;
    };

    preCreateSlide = function() {

    };

    createOptions = function(optionsNode) {
        var options = '<div>';

        for (var i in optionsNode) {
            options += '<div class="option-wrapper" data-slide-number="' + optionsNode[i].number + '">';
            if (optionsNode[i].description !== '') options += '<div class="description">' + optionsNode[i].description + '</div>';
            options += '<div class="option">' + optionsNode[i].label + '</div>';
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

            news.pubsub.emit('slide:prepare', [{ 'scroll' : true }]);
            news.$('.coming-soon').replaceWith(slideHtml);
            news.pubsub.emit('slide:created', [{ 'fade' : true, 'count' : that.count }]);
        })
    };

    updateNavigator = function(count) {
        news.$('.sidebar').find('circle.step-' + count).attr('class', 'on step-' + count);
        news.$('.sidebar').find('circle.step-' + (count + 1)).attr('class', 'next step-' + (count + 1));
        news.$('.sidebar').find('path.step-' + count).not('.trail').attr('class', 'anim step-' + count);

        news.$('.sidebar').find('li.step-' + count).attr('class', 'on step-' + count);
    };

    updateNavigatorNext = function(count) {
        news.$('.sidebar').find('circle.step-' + (count + 1)).attr('class', 'next step-' + (count + 1));
        news.$('.sidebar').find('path.trail.step-' + (count + 1)).attr('class', 'trail next step-' + (count + 1));
        news.$('.sidebar').find('path.step-' + (count + 1)).not('.trail').attr('class', 'next step-' + (count + 1));

        news.$('.sidebar').find('li.step-' + (count + 1)).attr('class', 'next step-' + (count + 1));
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
        });

        news.$('.slide.new').css({visibility:'visible', display:'none'})
    };

    sidebarEnlarge = function() {
        news.$('.sidebar').height(news.$('.sidebar').height() + 62);
    };

    scrollToSlide = function() {
        var offset = news.$('.coming-soon').offset().top;
        news.pubsub.emit('window:scrollTo', [offset, 400]);
    };

    createEventListenersMain = function() {
        var that = this;

        news.pubsub.on('slide:prepare', function (obj) {
            var scroll = obj.scroll;

            if (scroll) that.scrollToSlide();
        });

        news.pubsub.on('slide:created', function (obj) {
            console.log('ok this is original');
            var fade = obj.fade;

            that.bindOptions();
            that.heightPair();

            if (fade) {
                setTimeout(function(){
                    news.$('.slide.new').fadeIn('slow', function() {
                        news.$('.slide.new').removeClass('new');
                    });
                }, 350);
            } else {
                news.$('.slide.new').show().removeClass('new');
            }
        });
    };

    createEventListenersSidebar = function() {
        var that = this;

        news.pubsub.on('slide:created', function (obj) {
            var count = obj.count;

            console.log('ok this is weird');
            that.count = count;
            that.updateNavigator(count);
            that.sidebarEnlarge();
        });

        news.$("svg path").on('animationend webkitAnimationEnd oAnimationEnd oanimationEnd MSAnimationEnd', function() {
            that.updateNavigatorNext(that.count);
    	});
    };

    return {
        count: count,
        init: init,
        mainSequence: mainSequence,
        sidebarSequence: sidebarSequence,
        whichIFrame: whichIFrame,
        createFirstSlide: createFirstSlide,
        createSlide: createSlide,
        preCreateSlide: preCreateSlide,
        createOptions: createOptions,
        bindOptions: bindOptions,
        createEventListenersMain: createEventListenersMain,
        createEventListenersSidebar: createEventListenersSidebar,
        updateNavigator: updateNavigator,
        updateNavigatorNext: updateNavigatorNext,
        heightPair: heightPair,
        sidebarEnlarge: sidebarEnlarge,
        scrollToSlide: scrollToSlide
    }

});
