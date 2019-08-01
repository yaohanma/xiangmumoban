(function($, Math, window)
{
    'use strict';

    var Dashboard = function(element, options)
    {
        this.$ = $(element);
        this.options = this.getOptions(options);
        this.draggable = this.$.hasClass('dashboard-draggable') || this.options.draggable;

        this.init();
    };

    Dashboard.DEFAULTS = {
        height: 360,
        shadowType: 'normal',
        sensitive: false,
        circleShadowSize: 100,
        onFullScreen: function() {},
        onCollapse: function() {},
        onColor: function() {},
        onRemove: function() {}
    };

    Dashboard.prototype.getOptions = function(options)
    {
        options = $.extend(
        {}, Dashboard.DEFAULTS, this.$.data(), options);
        return options;
    };

    Dashboard.prototype.handleRemoveEvent = function()
    {
        var onRemove = this.options.onRemove;
        this.$.on('click', '.remove-panel', function()
        {
            var panel = $(this).closest('.panel');
            var row = panel.closest('.row');
            var name = panel.data('name') || panel.find('.panel-heading').text().replace('\n', '').replace(/(^\s*)|(\s*$)/g, '');
            var index = panel.attr('data-id');

            panel.parent().remove();
            var newOrder = 0;
            row.children(':not(.dragging-col-holder)').each(function()
            {
                var p = $(this).children('.panel');
                p.data('order', ++newOrder);
                p.parent().attr('data-order', newOrder);
            });
            if (onRemove && $.isFunction(onRemove))
            {
            	onRemove(index);
            }
        });
    };

    Dashboard.prototype.handleRefreshEvent = function()
    {
        this.$.on('click', '.refresh-panel', function()
        {
            var panel = $(this).closest('.panel');
            refreshPanel(panel);
        });
    };
    
      Dashboard.prototype.handleColorEvent = function()
    {
    	var onColor = this.options.onColor;
    	this.$.on('click', '[data-widget-setstyle]', function()
		{
			
    		$(this).closest('.panel').removeClass().addClass("panel").addClass($(this).data("widget-setstyle"));
    		$(this).closest('.panel').parent().attr("data-color", $(this).data("widget-setstyle"));
    		$(this).closest('ul').hide();
    		if (onColor && $.isFunction(onColor))
            {
    			onColor($(this).closest('.panel'));
            }
		});
    };
    Dashboard.prototype.toggles=function(){
    	this.$.on('click','[data-toggle="dropdown"]',function(){
    		$(this).next().toggle();
    	})
    }
    Dashboard.prototype.handleCollapseEvent = function()
    {
    	var onCollapse = this.options.onCollapse;
    	this.$.on('click', '.collapse-panel', function()
		{   
			//console.log(this);
			//.removeClass('glyphicon-plus').addClass('glyphicon-minus')
			if ($(this).children().hasClass("home_uncollapse")) {
				$(this).children().removeClass("home_uncollapse").addClass("home_collapse").removeClass('glyphicon-plus').addClass('glyphicon-minus').closest(".panel").children(".panel-body:first").slideDown();
				
			} else {
				$(this).children().removeClass("home_collapse").addClass("home_uncollapse").removeClass('glyphicon-minus').addClass('glyphicon-plus').closest(".panel").children(".panel-body:first").slideUp();
				
			}
			if (onCollapse && $.isFunction(onCollapse))
            {
				onCollapse($(this).closest('.panel'));
            }
		});
    };
    
    Dashboard.prototype.handleFullScreenEvent = function()
    {
    	var onFullScreen = this.options.onFullScreen;
    	this.$.on('click', '.fullscreen-panel', function()
		{
			
    		var panel = $(this).closest('.panel');
    		var action = "";
			if ($(".dashboard-fullscreen-mode").length > 0) {
				action = "compress";
				$(".nooverflow").removeClass("nooverflow");
				$(".panel-body:first", panel).attr("style", $(".dashboard-fullscreen-mode").data("panel-body-style"));
				$(document).scrollTop($(".dashboard-fullscreen-mode").data("scrollPosition"));
				panel.removeClass("dashboard-fullscreen-mode").find(".fullscreen-panel:first").children().removeClass("home_unfullscreen").addClass("home_fullscreen").parents(".panel-actions").children("a").show();
			} else {
				var scrollPosition = $(document).scrollTop();
				action = "expand";
				$("body").addClass("nooverflow");
				panel.addClass("dashboard-fullscreen-mode").find(".fullscreen-panel:first").children().removeClass("home_fullscreen").addClass("home_unfullscreen").parents(".panel-actions").children("a:not('.fullscreen-panel')").hide();
				$(".dashboard-fullscreen-mode").data("panel-body-style", $(".panel-body:first", panel).attr("style"));
				$(".dashboard-fullscreen-mode").data("scrollPosition", scrollPosition);
				$(".panel-body:first", panel).removeAttr("style");
				var panelBodyHeight = panel.outerHeight() - $(".panel-heading:first", panel).outerHeight();
				$(".panel-body:first", panel).outerHeight(panelBodyHeight);
			}
			if (onFullScreen && $.isFunction(onFullScreen))
            {
				onFullScreen(action, $(this).closest('.panel'));
            }
		});
    };
    Dashboard.prototype.clost = function(){
    	this.$.on('click', 'a', function(){
    		if($(this).hasClass('fullscreen-panel')){
  				if ( $(this).children().hasClass('glyphicon-resize-small')){//放大图标
  					 $(this).children().removeClass('glyphicon-resize-small').addClass('glyphicon-resize-full');
  					return;
  				} else{
  					$(this).children().removeClass('glyphicon-resize-full').addClass('glyphicon-resize-small');
  				}    			    			
    		}else{
    			var id = $(this).parents('.panel').attr('id');
    			if(id==='widget-6'||id==='widget-7'){
    				$(".nooverflow").removeClass("nooverflow");
    			}
    		}
    	})
    }//2016.9.6：bug2052
    Dashboard.prototype.handleDraggable = function()
    {
        var dashboard = this.$;
        var options = this.options;
        var circleShadow = options.shadowType === 'circle';
        var circleSize = options.circleShadowSize;
        var halfCircleSize = circleSize / 2;
        var afterOrdered = options.afterOrdered;
		
        this.$.addClass('dashboard-draggable');

        this.$.find('.panel-actions').mousedown(function(event)
        {
            event.preventDefault();
            event.stopPropagation();
        });

        var pColClass;
        this.$.find('.panel-heading').mousedown(function(event)
        {
            // console.log('--------------------------------');
            var panel = $(this).closest('.panel');
            var pCol = panel.parent();
            var row = panel.closest('.row');
            var dPanel = panel.clone().addClass('panel-dragging-shadow');
            var pos = panel.offset();
            var dPos = dashboard.offset();
            var dColShadow = row.find('.dragging-col-holder');
            var sWidth = panel.width(),
                sHeight = panel.height(),
                sX1, sY1, sX2, sY2, moveFn, dropCol, dropBefore, nextDropCol;
            if (!dColShadow.length)
            {
                dColShadow = $('<div class="dragging-col-holder"><div class="panel"></div></div>').removeClass('dragging-col').appendTo(row);
            }

            if (pColClass) dColShadow.removeClass(pColClass);
            dColShadow.addClass(pColClass = pCol.attr('class'));

            dColShadow.insertBefore(pCol).find('.panel').replaceWith(panel.clone().addClass('panel-dragging panel-dragging-holder'));

            dashboard.addClass('dashboard-dragging');
            panel.addClass('panel-dragging').parent().addClass('dragging-col');

            dPanel.css(
            {
                left: pos.left - dPos.left,
                top: pos.top - dPos.top,
                width: sWidth,
                height: sHeight
            }).appendTo(dashboard).data('mouseOffset',
            {
                x: event.pageX - pos.left + dPos.left,
                y: event.pageY - pos.top + dPos.top
            });

            if (circleShadow)
            {
                dPanel.addClass('circle');
                setTimeout(function()
                {
                    dPanel.css(
                    {
                        left: event.pageX - dPos.left - halfCircleSize,
                        top: event.pageY - dPos.top - halfCircleSize,
                        width: circleSize,
                        height: circleSize
                    }).data('mouseOffset',
                    {
                        x: dPos.left + halfCircleSize,
                        y: dPos.top + halfCircleSize
                    });
                }, 100);
            }

            $(document).bind('mousemove', mouseMove).bind('mouseup', mouseUp);
            event.preventDefault();

            function mouseMove(event)
            {
                // console.log('......................');
                var offset = dPanel.data('mouseOffset');
                sX1 = event.pageX - offset.x;
                sY1 = event.pageY - offset.y;
                sX2 = sX1 + sWidth;
                sY2 = sY1 + sHeight;
                dPanel.css(
                {
                    left: sX1,
                    top: sY1
                });

                row.find('.dragging-in').removeClass('dragging-in');
                dropBefore = false;
                dropCol = null;
                var area = 0,
                    thisArea;
                row.children(':not(.dragging-col)').each(function()
                {
                    var col = $(this);
                    if (col.hasClass('dragging-col-holder'))
                    {
                        dropBefore = (!options.sensitive) || (area < 100);
                        return true;
                    }
                    var p = col.children('.panel');
                    var pP = p.offset(),
                        pW = p.width(),
                        pH = p.height();
                    var pX = pP.left,
                        pY = pP.top;

                    if (options.sensitive)
                    {
                        pX -= dPos.left;
                        pY -= dPos.top;
                        thisArea = getIntersectArea(sX1, sY1, sX2, sY2, pX, pY, pX + pW, pY + pH);
                        if (thisArea > 100 && thisArea > area && thisArea > Math.min(getRectArea(sX1, sY1, sX2, sY2), getRectArea(pX, pY, pX + pW, pY + pH)) / 3)
                        {
                            area = thisArea;
                            dropCol = col;
                        }
                        // if(thisArea)
                        // {
                        //     console.log('panel ' + col.data('id'), '({0}, {1}, {2}, {3}), ({4}, {5}, {6}, {7})'.format(sX1, sY1, sX2, sY2, pX, pY, pX + pW, pY + pH));
                        // }
                    }
                    else
                    {
                        var mX = event.pageX,
                            mY = event.pageY;

                        if (mX > pX && mY > pY && mX < (pX + pW) && mY < (pY + pH))
                        {
                            // var dCol = row.find('.dragging-col');
                            dropCol = col;
                            return false;
                        }
                    }
                });

                if (dropCol)
                {
                    if (moveFn) clearTimeout(moveFn);
                    nextDropCol = dropCol;
                    moveFn = setTimeout(movePanel, 50);
                }
                event.preventDefault();
            }

            function movePanel()
            {
                if (nextDropCol)
                {
                    nextDropCol.addClass('dragging-in');
                    if (dropBefore) dColShadow.insertAfter(nextDropCol);
                    else dColShadow.insertBefore(nextDropCol);
                    dashboard.addClass('dashboard-holding');
                    moveFn = null;
                    nextDropCol = null;
                }
            }

            function mouseUp(event)
            {
                if (moveFn) clearTimeout(moveFn);

                var oldOrder = panel.data('order');
                panel.parent().insertAfter(dColShadow);
                var newOrder = 0;
                var newOrders = {};

                row.children(':not(.dragging-col-holder)').each(function()
                {
                    var p = $(this).children('.panel');
                    p.data('order', ++newOrder);
                    newOrders[p.attr('id')] = newOrder;
                    p.parent().attr('data-order', newOrder);
                });

                dPanel.remove();

                dashboard.removeClass('dashboard-holding');

                dashboard.find('.dragging-col').removeClass('dragging-col');
                dashboard.find('.panel-dragging').removeClass('panel-dragging');
                row.find('.dragging-in').removeClass('dragging-in');
                dashboard.removeClass('dashboard-dragging');
                $(document).unbind('mousemove', mouseMove).unbind('mouseup', mouseUp);
                dColShadow.remove();
                if (oldOrder != newOrders[panel.attr('id')])
                {
                    row.data('orders', newOrders);

                    if (afterOrdered && $.isFunction(afterOrdered))
                    {
                        afterOrdered(newOrders);
                    }
                }
                event.preventDefault();
            }
        });
    };

    Dashboard.prototype.handlePanelPadding = function()
    {
        this.$.find('.panel-body > table, .panel-body > .list-group').closest('.panel-body').addClass('no-padding');
    };

    Dashboard.prototype.handlePanelHeight = function()
    {
        var dHeight = this.options.height;

        this.$.find('.row').each(function()
        {
            var row = $(this);
            var panels = row.find('.panel');
            var height = row.data('height') || dHeight;

            if (typeof height != 'number')
            {
                height = 0;
                panels.each(function()
                {
                    height = Math.max(height, $(this).innerHeight());
                });
            }

            panels.each(function()
            {
                var $this = $(this);
                $this.find('.panel-body').css('height', height - 36);
            });
        });
    };

    function refreshPanel(panel)
    {
        var url = panel.data('url');
        if (!url) return;
        panel.addClass('panel-loading').find('.panel-heading .icon-refresh,.panel-heading .icon-repeat').addClass('icon-spin');
        $.ajax(
        {
            url: url,
            type: 'POST',
            dataType: 'html'
        }).done(function(data)
        {
            panel.find('.panel-body').html(data);
        }).fail(function()
        {
            panel.addClass('panel-error');
        }).always(function()
        {
            panel.removeClass('panel-loading');
            panel.find('.panel-heading .icon-refresh,.panel-heading .icon-repeat').removeClass('icon-spin');
        });
    }

    function getRectArea(x1, y1, x2, y2)
    {
        return Math.abs((x2 - x1) * (y2 - y1));
    }

    function isPointInner(x, y, x1, y1, x2, y2)
    {
        return x >= x1 && x <= x2 && y >= y1 && y <= y2;
    }

    function getIntersectArea(ax1, ay1, ax2, ay2, bx1, by1, bx2, by2)
    {
        var x1 = Math.max(ax1, bx1),
            y1 = Math.max(ay1, by1),
            x2 = Math.min(ax2, bx2),
            y2 = Math.min(ay2, by2);
        if (isPointInner(x1, y1, ax1, ay1, ax2, ay2) && isPointInner(x2, y2, ax1, ay1, ax2, ay2) && isPointInner(x1, y1, bx1, by1, bx2, by2) && isPointInner(x2, y2, bx1, by1, bx2, by2))
        {
            return getRectArea(x1, y1, x2, y2);
        }
        return 0;
    }

    Dashboard.prototype.init = function()
    {
        this.handleRefreshEvent();
        this.handleColorEvent();
        this.handleCollapseEvent();
        this.handleFullScreenEvent();
        this.handleRemoveEvent();
        this.handlePanelHeight();
        this.handlePanelPadding();
        this.clost();
        this.toggles();

        if (this.draggable) this.handleDraggable();

        var orderSeed = 0;
        this.$.find('.panel').each(function()
        {
            var $this = $(this);
            $this.data('order', ++orderSeed);
            if (!$this.attr('id'))
            {
                $this.attr('id', 'panel' + orderSeed);
            }
            if (!$this.attr('data-id'))
            {
                $this.attr('data-id', orderSeed);
            }

            refreshPanel($this);
        });
    };
    
    Dashboard.prototype.refreshPanel = function(panel)
    {
        refreshPanel(panel);
    };

    $.fn.dashboard = function(option)
    {
        return this.each(function()
        {
            var $this = $(this);
            var data = $this.data('zui.dashboard');
            var options = typeof option == 'object' && option;

            if (!data) $this.data('zui.dashboard', (data = new Dashboard(this, options)));

            if (typeof option == 'string') data[option]();
        });
    };

    $.fn.dashboard.Constructor = Dashboard;
}(jQuery, Math, window));
