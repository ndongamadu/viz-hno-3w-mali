var blueColor = '#418FDE';//'#056CB6';
var wwwColor  = '#9BB9DF';//'#C9D6EC';

var formatDecimalComma = d3.format(",.0f");

//tooltip
var rowtip = d3.tip().attr('class', 'd3-tip').html(function (d) {
    return d.key + ': ' + d3.format('0,000')(d.value);

});

//tooltip bar
var bartip = d3.tip().attr('class', 'd3-tip').html(function (d) {
    return d.data.key + ': ' + d3.format('0,000')(d.y);

});
function generatekeyFigures (hno,www) {
    var totalPIN      = 0,
        totalAffected = 0,
        nbOrgs        = 0;
    for(k in hno){
        totalPIN += parseInt(hno[k]['#inneed'])
        totalAffected += parseInt(hno[k]['#affected'])
    }
    $('#totalPIN').html(formatDecimalComma(totalPIN));
    $('#totalAffected').html(formatDecimalComma(totalAffected));

} //generatekeyFigures

function generateHNO (hnoData, geoData) {

    var cf = crossfilter(hnoData);
    var lookup = genLookup();
    var carte    = dc.leafletChoroplethChart('#map');
    var pinAdm2Chart = dc.rowChart('#pinAdm2Chart');
    // var totalPIN = dc.numberDisplay('#totalPIN');
    // var totalAffected = dc.numberDisplay('#totalAffected');
    // var totalOrgs = dc.numberDisplay('totalOrgs')

    var mapDim = cf.dimension(function(d){
        return d['#adm1+code'];
    });
    var pinDim = cf.dimension(function(d){
        return d['#adm2+name'];
    });

    var mapGroup = mapDim.group().reduceSum(function(d){
        return d['#inneed'];
    });
    var pinGroup = pinDim.group().reduceSum(function(d){
        return d['#inneed'];
    });

    pinAdm2Chart
        .width($('#map').width())
        .height(350)
        .dimension(pinDim)
        .group(pinGroup)
        .data(function(group){
            return group.top(15);
        })
        .colors(blueColor)
        .xAxis().ticks(4);

    carte.width($('#map').width())
         .height(330)
         .dimension(mapDim)
         .group(mapGroup)
         .center([0,0])
         .zoom(0)
         .geojson(geoData)
         .colors(['#DDDDDD', '#A7C1D3', '#71A5CA', '#3B88C0', '#056CB6'])
         .colorDomain([0, 4])
         .colorAccessor(function (d) {
            var c = 0
            if (d > 150000) {
                c = 4;
            } else if (d > 50000) {
                c = 3;
            } else if (d > 1000) {
                c = 2;
            } else if (d > 0) {
                c = 1;
            };
            return c
        })
        .featureKeyAccessor(function (feature) {
            return feature.properties['admin1Pcod'];

        }).popup(function (feature) {
            return lookup[feature.key];
        })
        .renderPopup(true);

    dc.renderAll();

    var map = carte.map();
    zoomToGeom(geoData);
    map.options.minZoom = 3;
    map.options.maxZoom = 5;
    function zoomToGeom(geom) {
        var bounds = d3.geo.bounds(geoData);
        map.fitBounds([
            [bounds[0][1], bounds[0][0]],
            [bounds[1][1], bounds[1][0]]
        ]);
    }

    function genLookup() {
        var lookup = {};
        geoData.features.forEach(function (e) {
            lookup[e.properties['admin1Pcod']] = String(e.properties['admin1Name']);
        });
        return lookup;
    }

} //generateHNO


function generatePinSectorCharts (data, wwwData) {
    // generate the left charts : PIN/Sector, PN/Region, ORG/Sector and ORG/Region

    var cf = crossfilter(data);

    var dimPinSector = cf.dimension(function(d){
        return d['#sector'];
    });
    var dimPinRegion = cf.dimension(function(d){
        return d['#adm1+name'];
    });
    var groupPinRegion = dimPinRegion.group().reduceSum(function(d){
        return d['#inneed'];
    });//.top(Infinity);

    var groupPinSector = dimPinSector.group().reduceSum(function(d){
        return d['#inneed'];
    });//.top(Infinity);

    var pinSectorChart = dc.rowChart('#pinSectorChart');
    var pinAdm1Chart   = dc.rowChart('#pinRegionChart');
    var OrgSectorChart = dc.rowChart('#orgSectorChart');
    var OrgAdm1Chart   = dc.rowChart('#orgRegionChart');

    pinSectorChart.width($('#sideChart').width())
                  .height(400)
                  .dimension(dimPinSector)
                  .group(groupPinSector)
                  .data(function(d){
                    return d.top(Infinity);
                  })
                  .colors(blueColor)
                  .xAxis().ticks(4);

    pinAdm1Chart.width($('#sideChart').width())
                  .height(350)
                  .dimension(dimPinRegion)
                  .group(groupPinRegion)
                  .data(function(d){
                    return d.top(Infinity);
                  })
                  .colors(blueColor)
                  .xAxis().ticks(4);

    pinSectorChart.render();
    pinAdm1Chart.render();

    var cf3w = crossfilter(wwwData);
    var dimOrgSector = cf3w.dimension(function(d){
        return d['#sector'];
    });
    var dimOrgRegion = cf3w.dimension(function(d){
        return d['#adm1+name'];
    });

    var groupOrgSector = dimOrgSector.group();
    var groupOrgRegion = dimOrgRegion.group();

    OrgSectorChart.width($('#sideChart').width())
                  .height(400)
                  .dimension(dimOrgSector)
                  .group(groupOrgSector)
                  .data(function(d){
                    return d.top(Infinity);
                  })
                  .colors(wwwColor)
                  .xAxis().ticks(4);

    OrgAdm1Chart.width($('#sideChart').width())
                  .height(350)
                  .dimension(dimOrgRegion)
                  .group(groupOrgRegion)
                  .data(function(d){
                    return d.top(Infinity);
                  })
                  .colors(wwwColor)
                  .xAxis().ticks(4);

    OrgSectorChart.render();
    OrgAdm1Chart.render();

    d3.selectAll('g.row').call(rowtip);
    d3.selectAll('g.row').on('mouseover', rowtip.show).on('mouseout', rowtip.hide);
} //generatePinSectorCharts


function generate3WSide (wwwData) {
    var cf = crossfilter(wwwData);

    var orgTypeChart = dc.barChart('#orgTypeChart');
    var orgTable     = dc.dataTable('#datatable');

    var dimOrgType   = cf.dimension(function(d){
        return d['#org+type'];
    });
    var dimTable   = cf.dimension(function(d){
        return [d['#org','#org+type','#adm1+name']];
    });
    var groupTable   = dimTable.group().reduceCount();
    var groupOrgType = dimOrgType.group().reduceCount();

    orgTypeChart.width(500)
                .height(140)
                .dimension(dimOrgType)
                .group(groupOrgType)
                .colors(wwwColor)
                .brushOn(false)
                .elasticX(true)
                .x(d3.scale.ordinal())
                .xUnits(dc.units.ordinal)
                .xAxis().ticks(4);
    // print_filter(groupTable);
    orgTable.dimension(dimTable)
            .group(function(d){
                return d.groupTable;
            })
            .columns([
                function(d){
                    return d['#org'];
                },
                function(d){
                    return d['#sector'];
                },
                function(d){
                    return d['#adm1+name'];
                }
            ])
            .sortBy(function(d){
                return d['#sector']
            });
    orgTable.render();
    orgTypeChart.xAxis();
    orgTypeChart.render();
    d3.selectAll('.bar').call(bartip);
    d3.selectAll('.bar').on('mouseover', bartip.show).on('mouseout', bartip.hide);
} //generate3WSide

// data calls
var pinSectorCall = $.ajax({
    type: 'GET',
    url: 'https://proxy.hxlstandard.org/data.json?strip-headers=on&url=https%3A%2F%2Fdocs.google.com%2Fspreadsheets%2Fd%2F1eNrVfniiv62WlpKAyrA6VJJx-plGa__6n0hbVnRdCbA%2Fedit%23gid%3D1866689087&force=on',
    dataType: 'json',
});

var pinGlobalCall = $.ajax({
    type: 'GET',
    url: 'https://proxy.hxlstandard.org/data.json?strip-headers=on&url=https%3A%2F%2Fdocs.google.com%2Fspreadsheets%2Fd%2F1eNrVfniiv62WlpKAyrA6VJJx-plGa__6n0hbVnRdCbA%2Fedit%23gid%3D752739684&force=on',
    dataType: 'json',
});

var geoDataCall = $.ajax({
    type: 'GET',
    url: 'data/mli.json',
    dataType: 'json',
});

var _3WCall = $.ajax({
    type: 'GET',
    url: 'https://proxy.hxlstandard.org/data.json?strip-headers=on&url=https%3A%2F%2Fdocs.google.com%2Fspreadsheets%2Fd%2F1eNrVfniiv62WlpKAyrA6VJJx-plGa__6n0hbVnRdCbA%2Fedit%23gid%3D803716133',
    dataType: 'json',
});

$.when(pinSectorCall, _3WCall, pinGlobalCall, geoDataCall).then(function(pinSectorArgs, _3wArgs, pinGlobalArgs, geomArgs){
    var _3wData       = hxlProxyToJSON(_3wArgs[0]);
    var pinSectorData = hxlProxyToJSON(pinSectorArgs[0]);
    var pinGlobalData = hxlProxyToJSON(pinGlobalArgs[0]);
    var geoData       = geomArgs[0];

    generatekeyFigures(pinGlobalData,_3wData)
    generateHNO(pinGlobalData, geoData)
    generatePinSectorCharts(pinSectorData,_3wData);
    generate3WSide(_3wData);
});

function hxlProxyToJSON(input){
    var output = [];
    var keys = [];
    input.forEach(function(e,i){
        if(i==0){
            e.forEach(function(e2,i2){
                var parts = e2.split('+');
                var key = parts[0]
                if(parts.length>1){
                    var atts = parts.splice(1,parts.length);
                    atts.sort();
                    atts.forEach(function(att){
                        key +='+'+att
                    });
                }
                keys.push(key);
            });
        } else {
            var row = {};
            e.forEach(function(e2,i2){
                row[keys[i2]] = e2;
            });
            output.push(row);
        }
    });
    return output;
}

function print_filter(filter) {
    var f = eval(filter);
    if (typeof (f.length) != "undefined") {} else {}
    if (typeof (f.top) != "undefined") {
        f = f.top(Infinity);
    } else {}
    if (typeof (f.dimension) != "undefined") {
        f = f.dimension(function (d) {
            return "";
        }).top(Infinity);
    } else {}
    console.log(filter + "(" + f.length + ") = " + JSON.stringify(f).replace("[", "[\n\t").replace(/}\,/g, "},\n\t").replace("]", "\n]"));
}
