require("../database");
const Stations = require("../models/Stations");
const Trains = require("../models/Trains");
const Relation = require("../models/Relation");
const Graph = require("../utils/pathfinder");

exports.findRoutes = async (req, res, next) => {
    const { start, end } = req.body;
    let routes = new Array;
    const relationsInput = await Relation.find({}, { "_id": 0 }).exec();
    const relations = JSON.parse(JSON.stringify(relationsInput).slice(1, -1).replace(/},{/g, ','));
    const pathGraph = new Graph(relations);
    const path = pathGraph.findShortestPath(start.toString(), end.toString());
    if (path) {
        routes.push({ "routeInfo": { "start": start, "path": path, "end": end }, "routes": await getDirectRoutes(start.toString(), end.toString()) }); // Direct Routes
        routes.push(await getRouteViaInterchange(path)); // Routes with interchanges
        req.routes = routes;
        return next();
    }
    else return res.json({ errorMsg: "Path not found" }); // No physical connection between points
}

exports.sortRoutes = (req, res, next) => {
    const directRoutes = req.routes[0]; // Direct Routes
    const routes = req.routes[1]; // Routes with interchanges
    const { start, end, mode, min } = req.body; // start point, end point, departure on time from start point/arrive on time to end point, minimal transfer time
    let { time } = req.body; // arrival/departure time
    let sortedRoutes = new Array; // routes only after start
    let routesOutput = new Array;
    let rawPairs = new Array;
    let interchangeRoutesOutput = new Array;
    if (directRoutes.routes) {
        directRoutes.routes.forEach(route => {
            route.stations.forEach(station => {
                if (mode == "start" && station.sid == start && station.departure >= time) sortedRoutes.push(route); // find all connections between interchange stations
                else if (mode == "end" && station.sid == end && station.arrival >= time) sortedRoutes.push(route); // find all connections between interchange stations
            });
        });
        sortedRoutes.forEach(route => {
            let currentStart, currentEnd;
            route.stations.forEach(station => {
                if (station.sid == start) currentStart = station;
                else if (station.sid == end) currentEnd = station;
            });
            routesOutput.push({ route: [currentStart, currentEnd, route._id] });
        });
    }
    if (routes.length !== 0) {
        let arrival = new Array;
        let departure = new Array;
        let currentPair = { "index1": -1, "index2": -1, "time": 10000, "arrival": time, "departure": 0 };
        let pairs = new Array;
        let i = 0;
        routes.routeInfo.interchangePoints.push({ "_id": end });
        while (0 < 1) {
            if (i == routes.routes.length - 1) break;
            const interchangePoint = routes.routeInfo.interchangePoints[i]._id;
            const nextInterchangePoint = routes.routeInfo.interchangePoints[i + 1]._id;
            routes.routes[i].forEach(route => {
                route.stations.forEach(station => {
                    let stationId = "";
                    if (station.sid == interchangePoint) {
                        arrival.push([station, route._id]);
                        stationId = station._id;
                    }
                    if (station.sid == start && stationId != start) departure.push([station, route._id]);
                });
            });
            routes.routes[i + 1].forEach(route => {
                route.stations.forEach(station => {
                    let stationId = "";
                    if (station.sid == interchangePoint) {
                        departure.push([station, route._id]);
                        stationId = station._id;
                    }
                    if (station.sid == nextInterchangePoint && station.arrival != false && nextInterchangePoint != stationId) arrival.push([station, route._id]);
                });
            });
            let arrTime = time - min;
            departure.forEach((dep, depIndex) => {
                arrival.forEach(async (arr, arrIndex) => {
                    if (dep[0].sid != arr[0].sid && dep[1] === arr[1]) {
                        rawPairs.push([dep, arr]);
                        arrTime = arr[0].arrival + min;
                    }
                });
            });
            arrival = new Array;
            departure = new Array;
            // pairs.push(currentPair);
            // currentPair = { "index1": -1, "index2": -1, "time": 10000, "arrival": time, "departure": 0 };
            i++;
        }
        const points = new Array({ _id: start }).concat(routes.routeInfo.interchangePoints);
        points.forEach((point, i) => {
            const currentRoute = new Array;
            rawPairs.forEach(element => {
                if (element[0][0].sid == point._id) currentRoute.push(element);
            });
            if (points.length - 1 !== i) interchangeRoutesOutput.push(currentRoute);
        });
    }
    // const sendFormatInterchange = () => {
    //     const routes = interchangeRoutesOutput;
    //     const length = routes.length;
    //     let { date } = req.body;
    //     console.log(date);
    //     let pairs = new Array();
    //     routes.forEach((routesDirection, i) => {
    //         routesDirection.forEach(routesPairs => {
    //             pairs.push([]);
    //             pairs[i].push([routesPairs[0][0].sid, routesPairs[1][0].sid, routesPairs[0][0].departure, routesPairs[1][0].arrival, routesPairs[0][1], date, routesPairs]);
    //         });
    //     });
    //     pairs = pairs.filter(e => {
    //         if (e.length) return e;
    //     });
    //     pairs.forEach((pair, i) => {
    //         if (0 === i) return;
    //         pair.forEach((nextPair, i2) => {
    //             pairs[0].forEach((mainPair, i3) => {
    //                 if (mainPair[3] < nextPair[2]) pairs[0][i3] = [mainPair, nextPair];
    //             });
    //         });
    //     });
    //     const newPairs = pairs[0].filter(e => {
    //         if (e.length === routes.length) return [e];
    //     });
    //     if (newPairs.length === 0) {
    //         let smallestValue = 1440, index = 0;
    //         for (let i = 0; i < pairs[pairs[0][0].length].length; i++) {
    //             if (pairs[pairs[0][0].length][i][3] < smallestValue) index = i;
    //         }
    //         const newDate = new Date(`${date.split(".")[2]}-${date.split(".")[1]}-${parseInt(date.split(".")[0]) + 1}`);
    //         pairs[pairs[0][0].length][index][5] = newDate.toLocaleDateString("pl");
    //         newPairs.push(pairs[0][0].concat([pairs[pairs[0][0].length][index]]));
    //     }
    //     return newPairs;
    // }
    // const sendFormatDirect = () => {
    //     const sendFormat = new Array();
    //     routesOutput.forEach(route => {
    //         sendFormat.push([
    //             route.route[0].sid,
    //             route.route[1].sid,
    //             route.route[0].departure,
    //             route.route[1].arrival,
    //             route.route[2]
    //         ]);
    //     });
    //     return sendFormat;
    // }
    // interchangeRoutesOutput = sendFormatInterchange();
    // routesOutput = sendFormatDirect();
    res.json({ routesOutput, interchangeRoutesOutput });
}

exports.findDirectRoutes = async (req, res) => {
    const { start, end } = req.body;
    res.json(await getDirectRoutes(start.toString(), end.toString()));
}

const getDirectRoutes = async (start, end) => {
    const routesInput = await Trains.find({
        $and: [
            { "stations.sid": start },
            { "stations.sid": end }
        ]
    });
    let sortedRoutes = new Array;
    routesInput.forEach(route => {
        let foundStart, foundEnd;
        route.stations.forEach((station, index) => {
            if (station.sid == start) foundStart = index;
            else if (station.sid == end) foundEnd = index;
        });
        if (foundStart < foundEnd) sortedRoutes.push(route);
    });
    sortedRoutes.forEach((route, index) => {
        let indexOfStart, indexOfEnd;
        route.stations.forEach(station => {
            if (station.sid.indexOf(start) == 0) indexOfStart = route.stations.indexOf(station);
            if (station.sid.indexOf(end) == 0) indexOfEnd = route.stations.indexOf(station);
        });
        if (!route.stations[indexOfStart].departure || !route.stations[indexOfEnd].arrival) sortedRoutes.splice(index, 1);
    });
    if (sortedRoutes == "") return false;
    return sortedRoutes;
}

const getRouteViaInterchange = async (path) => {
    const start = path.shift();
    const end = path.pop();
    const PotentialInterchangePoints = await Stations.find({ $or: [{ "class": "Premium" }, { "class": "Wojewódzki" }] }).where("_id").in(path);
    if (!PotentialInterchangePoints.length) return [];
    let routes = new Array;
    let potentialInterchangePointsOrdered = new Array;
    let interchangePointsOutput = new Array;
    path.forEach(pathPoint => {
        PotentialInterchangePoints.forEach(point => {
            if (pathPoint == point._id) potentialInterchangePointsOrdered.push(point);
        });
    });
    // for (let i = 0; i < interchangePoints.length + 1; i++) {
    //     if (i == 0) routes.push(await getDirectRoutes(start, potentialInterchangePointsOrdered[0]._id.toString()));
    //     else if (i == potentialInterchangePointsOrdered.length) routes.push(await getDirectRoutes(potentialInterchangePointsOrdered[interchangePoints.length - 1]._id.toString(), end));
    //     else routes.push(await getDirectRoutes(potentialInterchangePointsOrdered[i - 1], potentialInterchangePointsOrdered[i]));
    // }
    let i = 0, loopEnd = true;
    while (0 < 1) {
        if (i == 0) {
            routes.push(await getDirectRoutes(start, potentialInterchangePointsOrdered[i]._id.toString()));
            i++;
        }
        else if (loopEnd == true) {
            const route = await getDirectRoutes(potentialInterchangePointsOrdered[i - 1]._id.toString(), end);
            if (route.length) {
                routes.push(route);
                interchangePointsOutput.push(potentialInterchangePointsOrdered[i - 1]);
                break;
            }
            else loopEnd = false;
        }
        else {
            routes.push(await getDirectRoutes(potentialInterchangePointsOrdered[i - 1]._id.toString(), potentialInterchangePointsOrdered[i]._id.toString()));
            interchangePointsOutput.push(potentialInterchangePointsOrdered[i - 1]);
            i++;
            loopEnd = true;
        }
    }
    return { "routeInfo": { "start": start, "path": path, "end": end, "interchangePoints": interchangePointsOutput }, "routes": routes };
}