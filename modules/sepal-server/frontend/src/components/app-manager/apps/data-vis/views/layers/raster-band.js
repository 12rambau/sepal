/**
 * @author Mino Togna
 */
require( './raster-band.scss' )
var Chartist = require( 'chartist' )
var interact = require( 'interactjs' )
//interactjs

var EventBus = require( '../../../../../event/event-bus' )
var Events   = require( '../../../../../event/events' )

var template = require( './raster-band.html' )
var html     = $( template( {} ) )

var RasterBand = function ( rasterOptions, container, band ) {
    var $this = this
    
    //init html
    this.html = html.clone()
    container.append( this.html )
    
    // init properties
    this.rasterOptions = rasterOptions
    this.band          = band
    this.index         = this.band.index
    //band index
    this.bandIndex     = this.html.find( '[name=band-index]' )
    this.bandIndex.attr( 'max', this.rasterOptions.bandCount )
    this.bandIndex.val( this.index )
    var readOnly = this.rasterOptions.bandCount == 1
    this.bandIndex.prop( 'readonly', readOnly )
    // band histogram
    this.bandHistogram = this.html.find( '.band-histogram' )
    
    // min-max boundaries
    this.bandMinManx = this.html.find( '.band-minmax' )
    
    var params = {
        url      : '/sandbox/geo-web-viz/raster/band/' + $this.index + '?path=' + this.rasterOptions.layer.path
        , success: function ( response ) {
            $this.properties = response
            
            $this.initHistogram()
            $this.initColorPickers()
            $this.initHistogramOverlay()
        }
    }
    
    EventBus.dispatch( Events.AJAX.GET, null, params )
    
    
}

RasterBand.prototype.initHistogram = function () {
    var $this   = this
    var data    = {
        series: [ $this.properties.histogram ]
    }
    var options = {
        showPoint   : false,
        showLine    : false,
        showArea    : true,
        fullWidth   : true,
        showLabel   : false,
        axisX       : {
            showGrid : false,
            showLabel: false,
            offset   : 0
        },
        axisY       : {
            showGrid : false,
            showLabel: false,
            offset   : 0
        },
        chartPadding: 0
        
    }
    
    this.histogram = new Chartist.Line( this.bandHistogram.get( 0 ), data, options )
    
}

RasterBand.prototype.updateHistogram = function () {
    this.histogram.update()
}

RasterBand.prototype.initColorPickers = function () {
    var $this = this
    var band  = this.rasterOptions.layer.bands[ this.index ]
    
    // from color
    this.fromColor = this.html.find( '.from-color' )
    this.fromColor.colorpicker()
    this.fromColor.on( 'changeColor', function ( e ) {
        var color = e.color.toString( 'rgba' )
        $this.fromColor.find( 'i' ).css( 'background-color', color )
        
        // $this.layer.fill_color = color
    } )
    
    // if ( this.layer.fill_color ) {
    //     this.fillColorPicker.colorpicker( 'setValue', this.layer.fill_color )
    // }
}

RasterBand.prototype.initHistogramOverlay = function () {
    interact( this.bandMinManx.get( 0 ) )
        .draggable( {
            inertia : true,
            // keep the element within the area of it's parent
            restrict: {
                restriction: "parent",
                // endOnly: true,
                elementRect: { top: 0, left: 0, bottom: 1, right: 1 }
            },
            // onmove: window.dragMoveListener
            onmove  : function ( event ) {
                var target = event.target,
                    // keep the dragged position in the data-x/data-y attributes
                    x      = (parseFloat( target.getAttribute( 'data-x' ) ) || 0) + event.dx,
                    y      = (parseFloat( target.getAttribute( 'data-y' ) ) || 0) + event.dy;
                
                // translate the element
                target.style.webkitTransform =
                    target.style.transform =
                        // 'translate(' + x + 'px, ' + y + 'px)';
                        'translate(' + x + 'px)';
                
                // update the posiion attributes
                target.setAttribute( 'data-x', x );
                target.setAttribute( 'data-y', y );
            }
        } )
        .resizable( {
            preserveAspectRatio: true,
            edges              : { left: true, right: true, bottom: false, top: false },
            axis               : 'x',
            restrict           : {
                restriction: "parent"
            }
        } )
        .on( 'resizemove', function ( event ) {
            var target = event.target,
                x      = (parseFloat( target.getAttribute( 'data-x' ) ) || 0),
                y      = (parseFloat( target.getAttribute( 'data-y' ) ) || 0);
            
            var parentWidth    = $( event.target ).parent().width()
            var width          = Math.min( event.rect.width, parentWidth )
            target.style.width = width + 'px';
            
            // translate when resizing from top or left edges
            x += Math.floor( event.deltaRect.left );
            y += Math.floor( event.deltaRect.top );
            x = (x < 0) ? 0 : x
            
            target.style.webkitTransform = target.style.transform =
                // 'translate(' + x + 'px,' + y + 'px)';
                'translate(' + x + 'px)';
            
            target.setAttribute( 'data-x', x );
            target.setAttribute( 'data-y', y );
            // target.textContent = Math.round( event.rect.width ) + '×' + Math.round( event.rect.height );
        } )
    
}

var newInstance = function ( rasterOptions, container, band ) {
    return new RasterBand( rasterOptions, container, band )
}

module.exports = {
    newInstance: newInstance
}