document.onreadystatechange = function() {
    ;requirejs(["src/MapDatabase", "util/util"], function(MapDatabase, util) {
        const web = Object.freeze({
            cw3: "creeperworld3",
            pf: "particlefleet"
        });

        var data = {
            _version: 2,
            maps: [],
            game: "cw3", //"cw3", "pf"
            pageCur: 1,
            pageEnd: 1,
            pageEntries: 9,
            sortCur: "newest",
            sortRev: false,
            filterMinWidth: 0,
            filterMaxWidth: 0,
            filterMinHeight: 0,
            filterMaxHeight: 0,
            filterStartId: 0,
            filterText: "",
            filterMinRating: 0,
            filterNumRatings: 0,
            difficulty: "any"
        };
        load();

        //Container for some of the more important HTML elements used throughout.
        const elems = {
            page: document.getElementById("page"),
            pageCur: document.getElementById("pageCur"),
            pageEnd: document.getElementById("pageEnd"),
            buttonPagePrevious: document.getElementById("buttonPagePrevious"),
            buttonPageNext: document.getElementById("buttonPageNext")
        };

        //Handle all events and initialize HTML switches.
        (() => {
            var toggle = function(elems, onoff) {
                if(!(elems instanceof Array || elems instanceof NodeList))
                    elems = [elems];

                elems.forEach(elem => {
                    if(onoff) elem.classList.add("btn-toggle");
                    else      elem.classList.remove("btn-toggle");
                });
            }

            buttonPagePrevious.onclick = () => onPageSwitch(false);
            buttonPageNext.onclick = () => onPageSwitch(true);
            document.getElementById("buttonRefreshList").onclick = () => refresh();
            document.getElementById("buttonSortRandom").onclick = () => {
                var checkbox = this.checkgroupSortFilters.querySelector("input[type=checkbox][value=random]");
                checkbox.checked = true;
                checkbox.onchange();
            }

            {
                let elem = document.getElementById("checkgroupSortFilters");
                let checkboxes = elem.querySelectorAll("input[type=checkbox]");

                let uncheckAll = () => {
                    checkboxes.forEach(checkbox => {
                        checkbox.checked = false;
                    });
                }
                uncheckAll();
                checkboxes.forEach(checkbox => {
                    if(checkbox.value === data.sortCur)
                        checkbox.checked = true;
                });

                checkboxes.forEach(checkbox => {
                    checkbox.onchange = function() {
                        if(this.checked) {
                            uncheckAll();
                            this.checked = true;
                            data.sortCur = this.value;
                            showMaps();
                        }
                        else {
                            this.checked = true;
                        }
                    }
                });
            }
            {
                let elem = document.getElementById("checkSortReverse");
                elem.checked = data.sortRev;
                elem.onchange = function() {
                    data.sortRev = this.checked;
                    showMaps();
                }
            }
            {
                let elem = document.getElementById("buttongroupGame");
                let buttons = elem.querySelectorAll(".btn[data-id]");
                for(let i = 0; i < buttons.length; i++) {
                    if(buttons[i].getAttribute("data-id") === data.game) {
                        toggle(buttons[i], true);
                        break;
                    }
                }

                buttons.forEach(button => {
                    button.onclick = function() {
                        let game = this.getAttribute("data-id");
                        if(data.game !== game) {
                            toggle(buttons, false);
                            toggle(this, true);

                            data.game = game;
                            fetchMaps().then(() => {
                                showMaps();
                            }).catch(console.error);
                        }
                        data.game = game;
                    }
                });
            }
            {
                let elem = document.getElementById("textFilterText");
                elem.value = data.filterText;
                elem.oninput = () => {
                    data.filterText = elem.value;
                    showMaps();
                }
            }
            {
                let elem = document.getElementById("textFilterMinRating");
                elem.value = data.filterMinRating === 0 ? "" : data.filterMinRating;
                elem.oninput = () => {
                    let str = elem.value;
                    str = str.replace(/[^\d.,]/g, "")
                    let str1 = str.match(/\d*/);
                    let str2 = str.match(/[\.\,]\d*/);
                    str1 = str1 == null ? "" : str1[0];
                    str2 = str2 == null ? "" : str2[0];
                    str = str1 + str2;
                    str = str.replace(",", ".");

                    elem.value = str;

                    let number = Number(str);

                    if(number > 10) {
                        number = 10;
                        elem.value = number+"";
                    }

                    data.filterMinRating = number;
                    showMaps();
                }
            }
            {
                let elem = document.getElementById("buttongroupDifficulty");
                let buttons = elem.querySelectorAll(".btn[data-id]");
                for(let i = 0; i < buttons.length; i++) {
                    if(buttons[i].getAttribute("data-id") === data.difficulty) {
                        toggle(buttons[i], true);
                        break;
                    }
                }

                buttons.forEach(button => {
                    button.onclick = function() {
                        toggle(buttons, false);
                        toggle(this, true);

                        data.difficulty = this.getAttribute("data-id");
                        showMaps();
                    }
                });
            }
            {
                [["textFilterMinWidth", "filterMinWidth"],
                 ["textFilterMaxWidth", "filterMaxWidth"],
                 ["textFilterMinHeight", "filterMinHeight"],
                 ["textFilterMaxHeight", "filterMaxHeight"],
                 ["textFilterNumRatings", "filterNumRatings"],
                 ["textFilterStartId", "filterStartId"]].forEach(val => {
                    let elem = document.getElementById(val[0]);
                    elem.value = data[val[1]] === 0 ? "" : data[val[1]];
                    elem.oninput = () => {
                        var str = elem.value;
                        str = str.replace(/[\D]/g, "");
                        elem.value = str;
                        data[val[1]] = Number(str);
                        showMaps();
                    }
                });
            }
        })();

        refresh();

        /**
         * Load data from local storage.
         */
        function load() {
            let save = JSON.parse(localStorage.getItem("save"));
            if(save != null && save._version === data._version)
                Object.assign(data, save);
        }

        /**
         * Save data to local storage.
         */
        function save() {
            let save = Object.assign({}, data);
            delete save.maps;

            localStorage.setItem("save", JSON.stringify(save));
        }

        /**
         * Switch current page.
         * @param {boolean} next - True if 1 page forward, false if 1 page backward.
         */
        function onPageSwitch(next) {
            if(next) {
                if(data.pageCur >= data.pageEnd)
                    data.pageCur = data.pageEnd;
                else
                    data.pageCur++;
            }
            else {
                if(data.pageCur <= 1)
                    data.pageCur = 1;
                else
                    data.pageCur--;
            }

            updateButtons();
            showMaps();
        }

        /**
         * Force refresh everything.
         */
        function refresh() {
            fetchMaps().then(() => {
                updateButtons();
                showMaps();
            }).catch(console.error);
        }

        /**
         * Refresh all the switches on screen.
         */
        function updateButtons() {
            elems.buttonPagePrevious.style.visibility = data.pageCur <= 1 ? "hidden" : "unset";
            elems.buttonPageNext.style.visibility = data.pageCur >= data.pageEnd ? "hidden" : "unset";
            elems.pageCur.textContent = data.pageCur+"";
            elems.pageEnd.textContent = data.pageEnd+"";
        }

        /**
         * Update the cached map database.
         */
        async function fetchMaps() {
            let mapDatabase = new MapDatabase(`https://knucklecracker.com/${web[data.game]}/queryMaps.php?query=maplist`);

            data.maps = await mapDatabase.refresh();
        }

        /**
         * Refresh the shown maps based on all filter data.
         */
        function showMaps() {
            //Save whenever the screen is refreshed.
            save();
            //Clear the HTML container for map objects.
            elems.page.innerHTML = "";
            //Copy maps array so we can modify it based on filters.
            var maps = data.maps.slice();

            
            //Filter all elements that start after the specified start ID.
            if(data.filterStartId > 0) {
                maps = maps.filter(val => val.id <= data.filterStartId);
            }
            //Filter all elements that don't match the specified text.
            if(data.filterText.length > 0) {
                let str = data.filterText.trim().toLowerCase();
                maps = maps.filter(val => {
                    return val.title.toLowerCase().indexOf(str) > -1 ||
                           val.author.toLowerCase().indexOf(str) > -1 ||
                           val.desc.toLowerCase().indexOf(str) > -1;
                });
            }
            //Filter others.
            if(data.filterMinRating > 0) {
                maps = maps.filter(val => val.rating >= data.filterMinRating);
            }
            if(data.filterNumRatings > 0) {
                maps = maps.filter(val => val.ratings >= data.filterNumRatings);
            }
            if(data.filterMinWidth > 0) {
                maps = maps.filter(val => val.width >= data.filterMinWidth);
            }
            if(data.filterMaxWidth > 0) {
                maps = maps.filter(val => val.width <= data.filterMaxWidth);
            }
            if(data.filterMinHeight > 0) {
                maps = maps.filter(val => val.height >= data.filterMinHeight);
            }
            if(data.filterMaxHeight > 0) {
                maps = maps.filter(val => val.height <= data.filterMaxHeight);
            }

            //Filter all elements that don't match the specified difficulty.
            var difficulty = getDifficultyFromName(data.difficulty);
            if(difficulty[0] > 0 || difficulty[1] < Infinity) {
                maps = maps.filter(val => {
                    var ratio = val.scores / val.downloads;
                    return ratio >= difficulty[0] && ratio < difficulty[1];
                });
            }

            //Sort the maps based on the current selected sort filter.
            switch(data.sortCur) {
                case "newest":
                    data.sortRev ? maps.sort((a, b) => a.id - b.id) : maps.sort((a, b) => b.id - a.id);
                    break;
                case "rating":
                    data.sortRev ? maps.sort((a, b) => a.rating - b.rating) : maps.sort((a, b) => b.rating - a.rating);
                    break;
                case "scores":
                    data.sortRev ? maps.sort((a, b) => a.scores - b.scores) : maps.sort((a, b) => b.scores - a.scores);
                    break;
                case "median":
                    data.sortRev ? maps.sort((a, b) => a.median - b.median) : maps.sort((a, b) => b.median - a.median);
                    break;
                case "size":
                    data.sortRev ? maps.sort((a, b) => (a.width * a.height) - (b.width * b.height)) : maps.sort((a, b) => (b.width * b.height) - (a.width * a.height));
                    break;
                case "random":
                    maps.sort((a, b) => Math.random() * 2 - 1);
                    break;
                default:
                    maps = [];
            }

            //Update the max amount of pages based on how many maps are left.
            //If max pages exceeds current page, set current page to max pages.
            data.pageEnd = Math.max(Math.ceil(maps.length / data.pageEntries), 1);
            if(data.pageCur > data.pageEnd)
                data.pageCur = data.pageEnd;
            updateButtons();

            //Get the template for the map grid HTML object.
            var template = document.querySelector("template[data-id=mapBrowserElement]");
            //The starting index in the map array based on current page.
            var firstMap = (data.pageCur - 1) * data.pageEntries;
            //Iterate over an amount of maps that fits on the screen.
            for(let i = firstMap; i < firstMap + data.pageEntries; i++) {
                let node = template.content.cloneNode(true);
                let map = maps[i];

                //If the map at specified index exists, fill the container with data.
                if(map != null) {
                    for(let propertyName of Object.keys(map)) {
                        let elem = node.querySelector(`[data-id=${propertyName}]`);
                        if(elem) {
                            switch(propertyName) {
                                case "median":
                                    elem.textContent = util.msToTime(map[propertyName] * 1000 / 30);
                                    break;
                                case "rating": {
                                    let val = 10 - map[propertyName];
                                    let r = ((255 * val) / 10).toFixed(2);
                                    let g = (255 * (10 - val) / 10).toFixed(2);
                                    elem.style.color = `rgb(${r},${g},0)`;
                                    elem.textContent = map[propertyName];
                                    break;
                                }
                                default:
                                    elem.textContent = map[propertyName];
                            }
                        }
                    }
                    
                    //Query for the thumbnail.
                    let thumbnail = node.querySelector("img[data-id=thumbnail]");
                    thumbnail.src = `https://knucklecracker.com/${web[data.game]}/queryMaps.php?query=thumbnailid&id=` + map.id;

                    //Calculate the thumbnail aspect ratio so that we can position it properly.
                    let aspectRatio = map.width / map.height;
                    if(aspectRatio <= 1) {
                        thumbnail.style.width = Math.floor(aspectRatio * 100) + "%";
                        thumbnail.style.height = 100 + "%";
                    }
                    else {
                        thumbnail.style.width = 100 + "%";
                        thumbnail.style.height = Math.floor(1 / aspectRatio * 100) + "%";
                    }
                    setTimeout(() => {
                        thumbnail.parentElement.style.height = (thumbnail.parentElement.offsetWidth - 4) + "px";
                        thumbnail.parentElement.style.width = (thumbnail.parentElement.offsetWidth - 4) + "px";
                        thumbnail.parentElement.style.paddingTop = "2px";
                        thumbnail.parentElement.style.paddingLeft = "2px";
                    }, 0);
                }
                
                //Add the map container to the grid.
                elems.page.appendChild(node);
                //If the map wasn't found (thus we are out of bounds), we make the container invisible.
                //Deleting/not including it would break the grid layout.
                if(map == null) {
                    elems.page.children[elems.page.children.length - 1].style.visibility = "hidden";
                }
            }
        }

        /**
         * Map difficulty name to a bracket of (scores/downloads).
         * @param {string} str - Difficulty name.
         * @returns {[number, number]} - First number is the minimum bracket (inclusive), second number is the maximum bracket (exclusive).
         */
        function getDifficultyFromName(str) {
            if(str === "easy")
                return [0.3, Infinity];
            else if(str === "medium" || str === "normal")
                return [0.15, 0.3];
            else if(str === "hard")
                return [0.075, 0.15];
            else if(str === "expert")
                return [0, 0.075];
            else
                return [0, Infinity];
        }
    });
}