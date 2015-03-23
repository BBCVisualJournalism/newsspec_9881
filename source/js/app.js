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

    character = '';

    init = function (iframe) {
        if (iframe === 'main') {
            setTimeout(function (){
                this.mainSequence();
            }, 500);
        } else {
            this.sidebarSequence();
        }
    };

    mainSequence = function () {
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
        this.createFirstSlide();
    };

    sidebarSequence = function () {
        this.createEventListenersSidebar();
    };

    emitIframeProps = function () {
        var width = news.$('.main').width(),
            introHeight = news.$('.intro').outerHeight(),
            introH2 = news.$('.intro').find('h2').outerHeight();

        news.pubsub.emit('position:sidebar', [{'width' : width, 'introHeight' : introHeight + introH2 + 35}]);
    };

    createFirstSlide = function () {
        var that = this,
            slide,
            first,
            rest;

        first = this.createFirstSlideTitle();
        rest = this.createSlide(0);

        slide = first + rest;

        news.$('.intro').append(slide);
        news.pubsub.emit('slide:created', [{ 'count' : that.count, 'step' : 0 }]);
        news.pubsub.emit('scroll:end', []);
    };

    createFirstSlideTitle = function () {
        var title = '<h2>' + slides['main-title'] + '</h2>';

        return title;
    };

    createSlide = function (number) {
        var slide = slides['slide-' + number],
            content = slide['content'],
            image = slide['image'],
            title = slide['title'],
            subtitle = slide['subtitle'],
            options = this.createOptions(slide['options']),
            html = '<div class="slide new">',
            endCSSClass = '';

        if (title !== '') html +=  '<h2>' + title + '</h2>';
        if (image !== '') html += '<img src="' + image + '" />';
        if (content !== '') html += '<p>' + content + '</p>';
        if (subtitle !== '') {
            if (this.isThisTheEnd(slide)) {
                endCSSClass = ' end';
            }
            html += '<h3 class="' + endCSSClass + '">' + subtitle + '</h3>';
        }
        if (options !== '') html += options + '<hr>';

        html += '</div>';

        return html;
    };

    transitionSlide = function () {
        var that = this;

        that.heightPair('new');
        that.bindOptions();

        news.$('.slide.new').removeClass('new').addClass('current');
        news.$('.slide.current').find('.option').addClass('loaded');
    };

    createSlidePlaceholder = function () {
        var html = '<div class="coming-soon"></div>';

        return html;
    };

    createOptions = function (optionsNode) {
        var threeOptionsCSSClass = (optionsNode['c']) ? 'three' : '',
            options = '<div>';

        for (var i in optionsNode) {
            options += '<div class="option-wrapper ' + threeOptionsCSSClass + '" ';

            if (this.optionPostFilter(optionsNode[i].number)[1] === 'male' || this.optionPostFilter(optionsNode[i].number)[1] === 'female') {
                options += 'data-slide-number="' + this.optionPostFilter(optionsNode[i].number)[0] + '"';
                options += 'data-slide-character-option="' + this.optionPostFilter(optionsNode[i].number)[1] + '"';
            } else if  (!isNaN(this.optionPostFilter(optionsNode[i].number)[0])) {
                options += 'data-slide-number="' + this.optionPostFilter(optionsNode[i].number)[0] + '"';
                options += 'data-slide-second-option="' + this.optionPostFilter(optionsNode[i].number)[1] + '"';
            } else {
                options += 'data-slide-number="' + optionsNode[i].number + '"';
            }
            options += '>';
            if (optionsNode[i].description !== '') options += '<div class="description">' + optionsNode[i].description + '</div>';
            options += '<div class="option">' + optionsNode[i].label + '</div>';
            options += '</div>';
        }

        options += '</div>';

        if (optionsNode['a'].label === '') options = '';

        return options;
    };

    bindOptions = function () {
        var that = this;

        news.$('.slide.new').find('.option').bind('click', function () {
            var $slide = news.$(this).closest('.slide'),
                $optionWrapper = news.$(this).closest('.option-wrapper'),
                slideNumber = $optionWrapper.attr('data-slide-number'),
                slide = slides['slide-' + slideNumber],
                characterOption = $optionWrapper.attr('data-slide-character-option'),
                secondOption = $optionWrapper.attr('data-slide-second-option'),
                slideHtml = '';

            if (characterOption) {
                that.setCharacter(characterOption);
            }

            if (that.character === 'female' && secondOption) {
                slideNumber = secondOption;
            }

            slideHtml = that.createSlide(slideNumber) + that.createSlidePlaceholder();

            $slide.find('.option').unbind().removeClass('loaded');
            $optionWrapper.find('.option').addClass('selected');
            news.$('.slide.current').removeClass('current').addClass('previous');

            news.pubsub.emit('slide:prepare', [{ 'scroll' : true, 'slide' : slideHtml }]);
            news.$('.coming-soon').replaceWith(slideHtml);
            that.count++;
            news.pubsub.emit('slide:created', [{ 'fade' : true, 'count' : that.count, 'slide' : slide }]);
        });

        news.pubsub.emit('options:binded', []);
    };

    optionPostFilter = function (number) {
        if (number.indexOf('#') > -1) {
            return number.split("#");
        } else {
            return false;
        }
    };

    setCharacter = function (character) {
        this.character = character;
    };

    isThisTheEnd = function (slide) {
        var number = slide ? slide['options']['a']['number'] : 0;

        return number === '999';
    };

    heightPair = function (isNew) {
        var $slides = news.$('.slides'),
            $slide,
            $descriptions,
            highest = 0;

        if (isNew === 'new') {
            $slide = $slides.find('.slide.new');
        } else {
            $slide = $slides.find('.slide');
        }

        $slide.each(function() {
            $descriptions = news.$(this).find('.description');
            $descriptions.removeAttr('style');
            $descriptions.each(function () {
                var $currentItem = news.$(this),
                    $previousItem = news.$(this).closest('.option-wrapper').prev().find('.description');

                if ($currentItem.height() < $previousItem.height() && $previousItem.height() > highest) {
                    highest = $previousItem.height();
                } else if ($currentItem.height() > $previousItem.height() && $currentItem.height() > highest) {
                    highest = $currentItem.height();
                }
            });
            $descriptions.height(highest);
        });
    };

    scrollToSlide = function () {
        var offset = news.$('.coming-soon').offset().top;

        news.pubsub.emit('window:scrollTo', [offset, 550]);
    };

    requestFullScreen = function (element) {
         // Supports most browsers and their versions.
         var requestMethod = element.requestFullScreen || element.webkitRequestFullScreen || element.mozRequestFullScreen || element.msRequestFullscreen;
         if (requestMethod) { // Native full screen.
             requestMethod.call(element);
         } else if (typeof window.ActiveXObject !== "undefined") { // Older IE.
             var wscript = new ActiveXObject("WScript.Shell");
             if (wscript !== null) {
                 wscript.SendKeys("{F11}");
             }
         }

         //var elem = document.body; // Make the body go full screen.
         //requestFullScreen(elem);
    };

    createEventListenersMain = function () {
        var that = this;

        news.pubsub.on('slide:prepare', function (obj) {
            var scroll = obj.scroll,
                slide = obj.slide;

            if (scroll) that.scrollToSlide(slide);
        });

        news.pubsub.on('slide:created', function (obj) {
            var slide = obj.slide;

            if (that.isThisTheEnd(slide)) console.log('the end');
        });

        news.pubsub.on('scroll:end', function () {
            that.emitIframeProps();
            that.transitionSlide();
        });

        news.$(window).delayedResize(function () {
            that.heightPair();
            that.emitIframeProps();
        });
        /*$(window).resize(function () {
            setTimeout(function (){
                console.log('resize');
                that.heightPair();
            }, 10000);
        });*/
    };

    createEventListenersSidebar = function () {
        var that = this;

        news.pubsub.on('slide:prepare', function (obj) {
            that.sidebarEnlarge();
        });

        news.pubsub.on('slide:created', function (obj) {
            var count = obj.count;

            that.count = count;
            that.updateNavigator(count);
        });

        news.pubsub.on('iframe:loaded', function (obj) {
            var width = obj.width;

            that.sidebarMargin(width);
        });

        news.$("svg path").on('animationend webkitAnimationEnd oAnimationEnd oanimationEnd MSAnimationEnd', function () {
            that.updateNavigatorNext(that.count);
            news.pubsub.emit('navigator:updated', [{ 'fade' : true, 'count' : that.count}]);
    	});
    };

    updateNavigator = function (count) {
        var $sidebar = news.$('.sidebar');

        $sidebar.find('circle.step-' + count).attr('class', 'on step-' + count);
        $sidebar.find('circle.step-' + (count + 1)).attr('class', 'next step-' + (count + 1));
        $sidebar.find('path.step-' + count).not('.trail').attr('class', 'anim step-' + count);

        $sidebar.find('li.step-' + count).attr('class', 'on step-' + count);
    };

    updateNavigatorNext = function (count) {
        var $sidebar = news.$('.sidebar');

        $sidebar.find('circle.step-' + (count + 1)).attr('class', 'next step-' + (count + 1));
        $sidebar.find('path.trail.step-' + (count + 1)).attr('class', 'trail next step-' + (count + 1));
        $sidebar.find('path.step-' + (count + 1)).not('.trail').attr('class', 'next step-' + (count + 1));

        $sidebar.find('li.step-' + (count + 1)).attr('class', 'next step-' + (count + 1));
    };

    sidebarEnlarge = function () {
        news.$('.sidebar').height(news.$('.sidebar').height() + 62);
    };

    return {
        count: count,
        init: init,
        emitIframeProps: emitIframeProps,
        setCharacter: setCharacter,
        mainSequence: mainSequence,
        sidebarSequence: sidebarSequence,
        createFirstSlide: createFirstSlide,
        createFirstSlideTitle: createFirstSlideTitle,
        createSlide: createSlide,
        transitionSlide: transitionSlide,
        createSlidePlaceholder: createSlidePlaceholder,
        createOptions: createOptions,
        isThisTheEnd: isThisTheEnd,
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
