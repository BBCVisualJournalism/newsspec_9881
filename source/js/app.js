define([
    'lib/news_special/bootstrap',
    'lib/news_special/share_tools/controller',
    'data/slides'
], function (news, shareTools, slides) {

    news.sendMessageToremoveLoadingImage();

    count = 0;

    character = '';

    state = '';

    init = function (iframe) {
        if (iframe === 'main') {
            setTimeout(function () {
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

        setTimeout(function () {
            news.pubsub.emit('istats', ['syrian-journey-started', 'newsspec-interaction', null]);
        }, 500);

        this.createEventListenersMain();
        this.createFirstSlide();
    };

    sidebarSequence = function () {
        this.createEventListenersSidebar();
    };

    emitIframeProps = function () {
        var width = news.$('.main').width(),
            introHeight = news.$('.intro').outerHeight(),
            introH2 = news.$('.intro').find('h2').outerHeight(),
            rtl = (this.isRTL()) ? 'rtl' : 'ltr';

        news.pubsub.emit('sidebar:position', [{'display' : 'show', 'width' : width, 'introHeight' : introHeight + introH2 + 35, 'direction' : rtl}]);
    };

    createFirstSlide = function () {
        var that = this,
            slide,
            first,
            rest;

        first = this.createFirstSlideTitle();
        rest = this.createSlide(0);

        slide = first + rest;

        news.$('.intro').html(slide);
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
            staticPath = slides['static-path'],
            imageFilename = slide['image'],
            imgWidth = (number === 0) ? '913' : '730',
            image = staticPath + '/img/' + imgWidth + '/' + imageFilename + '?2',
            title = slide['title'],
            subtitle = slide['subtitle'],
            options = this.createOptions(slide['options']),
            html = '<div class="slide new">',
            endCSSID = '';

        if (title !== '') { html +=  '<h2>' + title + '</h2>'; }
        if (image !== '') { html += '<img src="' + image + '" />'; }
        if (content !== '') { html += '<p>' + content + '</p>'; }
        if (subtitle !== '') {
            if (this.isThisTheEnd(slide)) {
                endCSSID = 'end-try-again';
            }
            html += '<h3 id="' + endCSSID + '">' + subtitle + '</h3>';
        }
        if (options !== '') { html += options + '<hr>'; }

        html += '</div>';

        return html;
    };

    transitionSlide = function () {
        var that = this;

        that.heightPair('new');
        that.bindOptions('new');

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
            if (optionsNode[i].description !== '') { options += '<div class="description">' + optionsNode[i].description + '</div>'; }

            if (optionsNode[i].secondLabel && this.character === 'female') {
                options += '<div class="option"><span>' + optionsNode[i].secondLabel + '</span></div>';
            } else {
                options += '<div class="option"><span>' + optionsNode[i].label + '</span></div>';
            }
            options += '</div>';
        }

        options += '</div>';

        if (optionsNode['a'].label === '') { options = ''; }

        return options;
    };

    bindOptions = function (node) {
        var that = this;

        news.$('.slide.' + node).find('.option').bind('click', function () {
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
                slide = slides['slide-' + slideNumber];
            }

            slideHtml = that.createSlide(slideNumber) + that.createSlidePlaceholder();

            $slide.find('.option').unbind().removeClass('loaded');
            $optionWrapper.find('.option').addClass('selected');
            news.$('.slide.current').removeClass('current').addClass('previous');

            news.pubsub.emit('slide:prepare', [{ 'scroll' : true, 'slide' : slideHtml }]);
            news.$('.coming-soon').replaceWith(slideHtml);
            that.count++;
            news.pubsub.emit('istats', ['syrian-journey-option-clicked', 'newsspec-interaction', that.count]);
            news.pubsub.emit('slide:created', [{ 'fade' : true, 'count' : that.count, 'slide' : slide }]);
        });

        news.pubsub.emit('options:binded', []);
    };

    optionPostFilter = function (number) {
        if (number.indexOf('#') > -1) {
            return number.split('#');
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

    isRTL = function () {
        var rtl = news.$('html').attr('lang') === 'ar' || news.$('html').attr('lang') === 'fa' || news.$('html').attr('lang') === 'ur' || news.$('html').attr('lang') === 'ps';

        return rtl;
    };

    heightPair = function (isNew) {
        var $slides = news.$('.slides'),
            $slide,
            $descriptions,
            highestDescription = 0,
            highestOption = 0;

        if (isNew === 'new') {
            $slide = $slides.find('.slide.new');
        } else {
            $slide = $slides.find('.slide');
        }

        $slide.each(function () {
            $descriptions = news.$(this).find('.description');
            $options = news.$(this).find('.option');
            $descriptions.removeAttr('style');
            $options.removeAttr('style');
            $descriptions.each(function () {
                var $currentItem = news.$(this),
                    $previousItem = news.$(this).closest('.option-wrapper').prev().find('.description');

                if ($currentItem.height() < $previousItem.height() && $previousItem.height() > highestDescription) {
                    highestDescription = $previousItem.height();
                } else if ($currentItem.height() > $previousItem.height() && $currentItem.height() > highestDescription) {
                    highestDescription = $currentItem.height();
                }
            });
            $descriptions.height(highestDescription);
            highestDescription = 0;
            $options.each(function () {
                var $currentItem = news.$(this),
                    $previousItem = news.$(this).closest('.option-wrapper').prev().find('.option');

                if ($currentItem.height() < $previousItem.height() && $previousItem.height() > highestOption) {
                    highestOption = $previousItem.height();
                } else if ($currentItem.height() > $previousItem.height() && $currentItem.height() > highestOption) {
                    highestOption = $currentItem.height();
                }
            });
            $options.height(highestOption);
            highestOption = 0;
        });
    };

    tryAgainSequence = function () {
        var that = this,
            shareNode = slides['share'];

        news.$('.coming-soon').before('<div class="tempShareToolsHolder"></div>');

        shareTools.init('.tempShareToolsHolder', {
            storyPageUrl: document.referrer,
            header:       shareNode['title'],
            message:      shareNode['text'],
            template:     'dropdown' // 'default' or 'dropdown'
        });

        news.pubsub.emit('sidebar:end', []);

        news.$('#end-try-again').bind('click', function () {
            var offset = news.$('.intro').offset().top;
            that.state = 'end';
            news.pubsub.emit('istats', ['syrian-journey-try-again', 'newsspec-interaction', null]);
            news.pubsub.emit('window:scrollTo', [offset, 550]);
        });
    };

    scrollToSlide = function () {
        var offset = news.$('.coming-soon').offset().top;

        news.pubsub.emit('window:scrollTo', [offset, 550]);
    };

    requestFullScreen = function (element) {
        var requestMethod = element.requestFullScreen || element.webkitRequestFullScreen || element.mozRequestFullScreen || element.msRequestFullscreen;

        if (requestMethod) {
            requestMethod.call(element);
        } else if (typeof window.ActiveXObject !== 'undefined') { // Older IE.
            var wscript = new ActiveXObject('WScript.Shell');
            if (wscript !== null) {
                wscript.SendKeys('{F11}');
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

            if (scroll) { that.scrollToSlide(slide); }
        });

        news.pubsub.on('slide:created', function (obj) {
            var slide = obj.slide;

            if (that.isThisTheEnd(slide)) { that.tryAgainSequence(); }
        });

        news.pubsub.on('scroll:end', function () {
            if (that.state === 'end') {
                that.state = '';
                news.$('.slides').find('.slide').remove();
                that.bindOptions('previous');
                that.count = 0;
                that.character = '';
                news.$('.intro').find('.option').removeClass('selected').addClass('loaded');
                news.$('.intro').removeClass('previous').addClass('current');
                news.$('.tempShareToolsHolder').hide();
                news.$('.coming-soon').show();
                news.pubsub.emit('sidebar:reset', []);
                news.pubsub.emit('sidebar:position', [{'display' : 'hide', 'width' : null, 'introHeight' : null}]);
            } else {
                that.state = '';
                that.emitIframeProps();
                that.transitionSlide();
            }
        });

        news.$(window).delayedResize(function () {
            that.heightPair();
            that.emitIframeProps();
        });

        /*news.$('.full').bind('click', function () {
            var elem = document.body; // Make the body go full screen.
            that.requestFullScreen(elem);
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

        news.pubsub.on('sidebar:reset', function () {
            var $sidebar = news.$('.sidebar');

            $sidebar.find('path').attr('class', function () {
                var cssClass = news.$(this).attr('class').replace('next', '').replace('anim', '');

                return cssClass;
            });

            $sidebar.find('circle').attr('class', function () {
                var cssClass = news.$(this).attr('class').replace('next', '').replace('on', '');

                return cssClass;
            });

            $sidebar.find('li').removeClass('on').removeClass('next');
            $sidebar.find('.end').addClass('off');
            $sidebar.find('.end').hide();
            $sidebar.removeAttr('style');

            //$sidebar.find('li.step-' + count).attr('class', 'on step-' + count);
        });

        news.pubsub.on('sidebar:end', function () {
            news.$('.sidebar').find('.end').show();
        });

        news.pubsub.on('iframe:loaded', function (obj) {
            var width = obj.width;

            that.sidebarMargin(width);
        });

        news.$('svg path').on('animationend webkitAnimationEnd oAnimationEnd oanimationEnd MSAnimationEnd', function () {
            that.updateNavigatorNext(that.count);
            news.pubsub.emit('navigator:updated', [{ 'fade' : true, 'count' : that.count}]);
        });
    };

    updateNavigator = function (count) {
        var $sidebar = news.$('.sidebar');

        $sidebar.find('.end').addClass('off');
        $sidebar.find('circle.step-' + count).attr('class', 'on step-' + count);
        $sidebar.find('circle.step-' + (count + 1)).attr('class', 'next step-' + (count + 1));
        $sidebar.find('path.step-' + count).not('.trail').attr('class', 'anim step-' + count);

        $sidebar.find('li.step-' + count).attr('class', 'on step-' + count);

        $sidebar.find('.fallback').attr('class', 'fallback step-' + count);
    };

    updateNavigatorNext = function (count) {
        var $sidebar = news.$('.sidebar');

        $sidebar.find('circle.step-' + (count + 1)).attr('class', 'next step-' + (count + 1));
        $sidebar.find('path.trail.step-' + (count + 1)).attr('class', 'trail next step-' + (count + 1));
        $sidebar.find('path.step-' + (count + 1)).not('.trail').attr('class', 'next step-' + (count + 1));

        $sidebar.find('li.step-' + (count + 1)).attr('class', 'next step-' + (count + 1));
        $sidebar.find('.end').removeClass('off');
    };

    sidebarEnlarge = function () {
        news.$('.sidebar').height(news.$('.sidebar').outerHeight(true) + 62);
    };

    return {
        count: count,
        init: init,
        emitIframeProps: emitIframeProps,
        setCharacter: setCharacter,
        mainSequence: mainSequence,
        sidebarSequence: sidebarSequence,
        tryAgainSequence: tryAgainSequence,
        createFirstSlide: createFirstSlide,
        createFirstSlideTitle: createFirstSlideTitle,
        createSlide: createSlide,
        transitionSlide: transitionSlide,
        createSlidePlaceholder: createSlidePlaceholder,
        createOptions: createOptions,
        isThisTheEnd: isThisTheEnd,
        isRTL: isRTL,
        bindOptions: bindOptions,
        createEventListenersMain: createEventListenersMain,
        createEventListenersSidebar: createEventListenersSidebar,
        updateNavigator: updateNavigator,
        updateNavigatorNext: updateNavigatorNext,
        heightPair: heightPair,
        sidebarEnlarge: sidebarEnlarge,
        scrollToSlide: scrollToSlide
    };

});
