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
    news.sendMessageToremoveLoadingImage();

    count = 0;

    init = function() {
        if (this.whichIFrame() === 'main') {
            this.mainSequence();
        } else {
            this.sidebarSequence();
        }
    };

    whichIFrame = function() {
        isIFrame = news.$('.main').hasClass('second') ? 'sidebar' : 'main';
        return isIFrame;
    };

    mainSequence = function() {
        var that = this,
            slide,
            first,
            rest;

        shareTools.init('.tempShareToolsHolder', {
            storyPageUrl: document.referrer,
            header:       'Share this page',
            message:      'Custom message',
            hashtag:      'BBCNewsGraphics',
            template:     'dropdown' // 'default' or 'dropdown'
        });

        this.createEventListenersMain();

        first = this.createFirstSlide();
        rest = this.createSlide(0);

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
            image = slide['image'],
            title = slide['title'],
            subtitle = slide['subtitle'],
            options = this.createOptions(slide['options']),
            html = '<div class="slide new">';

        if (title !== '') html +=  '<h2>' + title + '</h2>';
        if (image !== '') html += '<img src="' + image + '" />';
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

        news.$('.slides').find('.option').unbind().bind('click', function() {
            var slide = news.$(this).closest('.option-wrapper').attr('data-slide-number'),
                slideHtml = that.createSlide(slide);

            news.pubsub.emit('slide:prepare', [{ 'scroll' : true }]);
            news.$('.coming-soon').replaceWith(slideHtml);

            news.pubsub.emit('slide:created', [{ 'fade' : true, 'count' : that.count }]);
        })

        news.pubsub.emit('options:binded', []);
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

    heightPair = function(isNew) {
        var $slides = news.$('.slides'),
            $slide,
            $descriptions;

        if (isNew === 'new') {
            $slide = news.$('.slide.new');
        } else {
            $slide = news.$('.slide');
        }

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

        news.pubsub.emit('height:paired', []);
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

        news.pubsub.on('slide:created', function () {
            console.log('main iframe');
            that.bindOptions();
        });

        news.pubsub.on('options:binded', function () {
            console.log('options binded');
            that.heightPair('new');
        });

        news.pubsub.on('height:paired', function () {
            console.log('height paired');
            news.$('.slide.new').css({visibility:'visible', display:'none'});

            var fade = true;
            if (fade) {
                setTimeout(function(){
                    news.$('.slide.new').fadeIn('slow', function() {
                        news.$('.slide.new').removeClass('new');
                    });
                }, 650);
            } else {
                news.$('.slide.new').show().removeClass('new');
            }
        });

        /*$(window).resize(function() {
            setTimeout(function(){
                console.log('resize');
                that.heightPair();
            }, 10000);
        });*/
    };

    createEventListenersSidebar = function() {
        var that = this;

        news.pubsub.on('slide:created', function (obj) {
            var count = obj.count;

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
