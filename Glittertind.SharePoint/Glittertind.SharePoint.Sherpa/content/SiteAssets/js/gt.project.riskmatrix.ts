namespace GT.Project.RiskMatrix {
    let __RISKS: RiskItem[] = [],
        __VIEWS: View[] = [],
        __CURRENT_VIEW = null;

    const __CONFIG = {
        RISK_LIST_NAME: "Usikkerhet",
        CONTAINER: "#gt-riskmatrix",
        VIEW_SELECTOR: "#gt-riskmatrix-viewselector",
        POST_ACTION_CHECKBOX: "#gt-riskmatrix-postaction",
        NUM_COLUMNS: 6,
        NUM_ROWS: 6,
        STATUS_FILL: [
            "none",
            "#d94a5e",
            "#f5a164",
            "#FFE654",
            "#9acd62",
            "#55AA55"
        ],
        STATUS_BLUE: "#3867c8",
        TEXT_BLUE: "#002e5e",
        LEGEND_TEXT: [
            "Høyst sannsynlig",
            "Meget sannsynlig",
            "Sannsynlig",
            "Lite sannsynlig",
            "Usannsynlig",
            "Ufarlig",
            "Mindre farlig",
            "Farlig",
            "Kritisk",
            "Katastrofalt",
        ],
    };

    class RiskItem {
        public Id?: number
        public Title: string;
        public Text: string;
        public Consequence: number;
        public Probability: number;
        public RiskFactor: number;
        public ProbabilityPostAction: number;
        public ConsequencePostAction: number;
        public RiskFactiorPostAction: number;
        public IdenticalRisks: number
        public Placement: number

        constructor(fieldValues: any) {
            this.Id = fieldValues.ID;
            this.Title = fieldValues.Title;
            this.Text = fieldValues.GtRiskAction;
            this.Consequence = fieldValues.GtRiskConsequence;
            this.Probability = fieldValues.GtRiskProbability;
            this.RiskFactor = fieldValues.GtRiskFactor;
            this.ProbabilityPostAction = fieldValues.GtRiskProbabilityPostAction;
            this.ConsequencePostAction = fieldValues.GtRiskConsequencePostAction;
            this.RiskFactiorPostAction = fieldValues.GtRiskFactiorPostAction;
        };

        public getX(c: MatrixConfig): number {
            let x = (c.SHOW_LEGEND) ?
                ((c.W / c.NUM_COLS) * (c.POST_ACTION ? this.ConsequencePostAction : this.Consequence)) + (c.W / 10) - 18 :
                ((c.W / c.NUM_COLS) * (c.POST_ACTION ? this.ConsequencePostAction : this.Consequence)) - (c.W / 10) - 9;
            if (this.Id >= 10) { x -= 10; }
            if (this.Placement === 1) { x -= (c.W / 20); } else
                if (this.Placement === 2) { x += (c.W / 20); }
            return x;
        };

        public getY(c: MatrixConfig): number {
            let y = (c.SHOW_LEGEND) ?
                c.H - (((c.H / c.NUM_ROWS * (c.POST_ACTION ? this.ProbabilityPostAction : this.Probability))) - (c.H / 10) + (c.H / c.NUM_ROWS) - 2) :
                c.H - (((c.H / c.NUM_ROWS) * (c.POST_ACTION ? this.ProbabilityPostAction : this.Probability)) - (c.H / c.NUM_ROWS) + (c.HALF_ROW_HEIGHT / 2));
            if (this.Placement === 3) { y -= (c.H / 18); }
            if (this.Placement === 4) { y += (c.H / 18); }
            return y;
        };

        public getSum(c: MatrixConfig): number {
            return c.POST_ACTION ? (this.Probability * this.Consequence) : (this.ProbabilityPostAction * this.ConsequencePostAction);
        }
    };
    class View {
        ID: string;
        Title: string;
        ServerRelativeUrl: string;
        ViewQuery: string;
    };
    class MatrixConfig {
        AUTO_WIDTH?: number;
        AUTO_HEIGHT?: number;
        SHOW_LEGEND?: boolean;
        W?: number;
        H?: number;
        HP?: number;
        WP?: number;
        NUM_COLS?: number;
        NUM_ROWS?: number;
        COL_WIDTH?: number;
        ROW_HEIGHT?: number;
        HALF_ROW_HEIGHT?: number;
        POST_ACTION: boolean;

        constructor($__container, postAction) {
            this.AUTO_WIDTH = $__container.parent().width() * 0.9;
            this.AUTO_HEIGHT = this.AUTO_WIDTH / 2;
            this.SHOW_LEGEND = ($__container.data("showlegend") === false) ? false : true;
            this.W = $__container.data("width") || this.AUTO_WIDTH;
            this.H = $__container.data("height") || this.AUTO_HEIGHT;
            this.HP = this.H + 30;
            this.WP = this.W + 20;
            this.NUM_COLS = (this.SHOW_LEGEND) ? __CONFIG.NUM_COLUMNS : __CONFIG.NUM_COLUMNS - 1;
            this.NUM_ROWS = (this.SHOW_LEGEND) ? __CONFIG.NUM_ROWS : __CONFIG.NUM_ROWS - 1;
            this.COL_WIDTH = this.W / this.NUM_COLS;
            this.ROW_HEIGHT = this.H / this.NUM_ROWS;
            this.HALF_ROW_HEIGHT = this.ROW_HEIGHT / 2;
            this.POST_ACTION = postAction;
        }
    };

    /**
     * Get risks
     * 
     * @param {string} viewQuery View Query
     */
    function GetRisks(viewQuery = ""): JQueryPromise<RiskItem[]> {
        let def = jQuery.Deferred(),
            ctx = SP.ClientContext.get_current(),
            list = ctx.get_web().get_lists().getByTitle(__CONFIG.RISK_LIST_NAME);
        let query = new SP.CamlQuery();
        query.set_viewXml(`<View><Query>${viewQuery}</Query></View>`);
        let items = list.getItems(query);
        ctx.load(items);
        ctx.executeQueryAsync(() => {
            __RISKS = items.get_data().map(d => {
                let fieldValues = d.get_fieldValues();
                return new RiskItem(fieldValues);
            });
            def.resolve(__RISKS);
        }, def.reject);
        return def.promise();
    };

    /**
     * Get views
     */
    function GetViews(): JQueryPromise<View[]> {
        let def = jQuery.Deferred(),
            ctx = SP.ClientContext.get_current(),
            list = ctx.get_web().get_lists().getByTitle(__CONFIG.RISK_LIST_NAME),
            views = list.get_views();
        ctx.load(views);
        ctx.executeQueryAsync(() => {
            __VIEWS = views.get_data().map(v => {
                return {
                    ID: v.get_id().toString(),
                    Title: v.get_title(),
                    ServerRelativeUrl: v.get_serverRelativeUrl(),
                    ViewQuery: v.get_viewQuery(),
                }
            });
            def.resolve(__VIEWS);
        }, def.reject);
        return def.promise();
    };

    /**
     * Render View Selector
     */
    function RenderViewSelector(): void {
        let $__viewSelector = jQuery(__CONFIG.VIEW_SELECTOR);
        GetViews().then(views => {
            let _outHtml = views
                .filter(v => v.Title !== "")
                .map(v => `<option value="${v.ID}">${v.Title}</option>`).join("");
            $__viewSelector
                .html(_outHtml)
                .on("change", () => {
                    let viewId = $__viewSelector.val(),
                        view = __VIEWS.filter(v => v.ID === viewId)[0];
                    RenderMatrix(view);
                    __CURRENT_VIEW = view;
                });
        });
    };
    
    /**
     * Render Matrix
     * 
     * @param {View} view The view
     * @param {boolean} postAction Use post action values
     */
    function RenderMatrix(view: View = null, postAction = false): void {
        let $__container = jQuery(__CONFIG.CONTAINER),
            __ = new MatrixConfig($__container, postAction);
        $__container
            .fadeTo("fast", 0)
            .html("");

        let viewQuery = view ? view.ViewQuery : "";
        GetRisks(viewQuery).then(risks => {
            risks.forEach(risk => {
                let placement = 0,
                    identicalRisks = jQuery.grep(risks, (e: RiskItem) => {
                        return __.POST_ACTION ? (e.Consequence === risk.Consequence && e.Probability === risk.Probability) : (e.Consequence === risk.Consequence && e.Probability === risk.Probability);
                    });
                if (identicalRisks.length > 1) {
                    for (let ir = 0; ir < identicalRisks.length; ir++) {
                        identicalRisks[ir].Placement = placement;
                        placement++;
                    }
                }
            });
            let xScale = d3["scale"].linear()
                .domain([0.5, 5.5])
                .range([__.W / __.NUM_COLS, __.W]);
            let yScale = d3["scale"].linear()
                .domain([0.5, 5.5])
                .range([__.H - (__.H / __.NUM_ROWS), 0]);
            let svg = d3.select(__CONFIG.CONTAINER)
                .append("svg")
                .attr("width", __.W)
                .attr("height", __.H)
                .attr("class", "riskSVG")
                .attr("style", "overflow:visible;");
            let riskbg = d3.select(".riskSVG"),
                startx = 0,
                starty = 0,
                i = 0,
                fill: string,
                ltIndex = 0;
            while (i < (__.NUM_COLS * __.NUM_ROWS)) {
                let fillArr = (__.SHOW_LEGEND === true) ?
                    [
                        0, 3, 2, 1, 1, 1,
                        0, 4, 3, 2, 1, 1,
                        0, 5, 4, 3, 2, 1,
                        0, 5, 5, 4, 3, 2,
                        0, 5, 5, 5, 4, 3,
                        6, 0, 0, 0, 0, 0,
                    ]
                    :
                    [
                        3, 2, 1, 1, 1,
                        4, 3, 2, 1, 1,
                        5, 4, 3, 2, 1,
                        5, 5, 4, 3, 2,
                        5, 5, 5, 4, 3,
                    ];
                if (fillArr[0] === 0) {
                    let l = riskbg.append("text");
                    l.attr("class", "risk-legendText")
                        .attr("id", "RiskLegendItem" + ltIndex)
                        .attr("dx", function () {
                            if (ltIndex < 5) { return 5; } else {
                                return (__.COL_WIDTH * (ltIndex - 3) - (__.COL_WIDTH)) + 20;
                            }
                        })
                        .attr("dy", function () {
                            if (ltIndex < 5) { return (__.ROW_HEIGHT * (ltIndex + 1)) - (__.HALF_ROW_HEIGHT) + 5; } else {
                                return (__.H - __.HALF_ROW_HEIGHT) + 5;
                            }
                        })
                        .text(__CONFIG.LEGEND_TEXT[ltIndex]);
                    ltIndex++;
                }
                fill = __CONFIG.STATUS_FILL[fillArr[i]];
                if (i % __.NUM_COLS === 0 && i !== 0) {
                    starty += (__.ROW_HEIGHT);
                    startx = 0;
                }
                riskbg.append("rect")
                    .attr("fill", fill)
                    .attr("stroke", "#cccccc")
                    .attr("opacity", 1)
                    .attr("width", __.COL_WIDTH)
                    .attr("height", __.ROW_HEIGHT)
                    .attr("x", startx)
                    .attr("y", starty)
                    .attr("id", "rect" + i);
                startx += (__.W / __.NUM_COLS);
                i++;
            }
            let a = svg.selectAll("g").data(risks).enter().append("a");
            a
                .attr("onclick", d => `SP.UI.ModalDialog.showModalDialog({ url: '${_spPageContextInfo.webServerRelativeUrl}/Lists/Usikkerhet/DispForm.aspx?ID=${d.Id}' })`)
                .attr("xlink:href", "#")
                .attr("cursor", "pointer")
                .attr("dx", (d: RiskItem) => d.getX(__))
                .attr("dy", (d: RiskItem) => d.getY(__))
                .attr("id", (d: RiskItem) => `risklink${d.Id}`)
                .append("text")
                .attr("fill", __CONFIG.STATUS_BLUE)
                .attr("id", (d: RiskItem) => "circle" + d.Id)
                .attr("dx", (d: RiskItem) => d.getX(__))
                .attr("dy", (d: RiskItem) => d.getY(__))
                .text(d => d.Id)
                .on("mouseover", function (d: RiskItem) { d3.select(`#risktext${d.Id}`)["style"]("display", "block"); })
                .on("mouseout", function (d: RiskItem) { d3.select(`#risktext${d.Id}`)["style"]("display", "none"); });
            let textPosX = __.WP,
                textPosY = 0;
            if ($__container.data("textposition")) {
                let pos = $__container.data("textposition");
                if (pos = "bottom") {
                    textPosX = 0;
                    textPosY = __.HP;
                    $__container.css("padding-bottom", "75px");
                }
            }
            let group = svg.selectAll("g")
                .data(risks)
                .enter()
                .append("g")
                .attr("x", textPosX)
                .attr("y", textPosY)
                .attr("style", "display:none")
                .attr("id", (d: RiskItem) => `risktext${d.Id}`);

            let txt = group.append("text")
                .attr("x", textPosX)
                .attr("y", textPosY)
                .attr("font-family", "'open_sansregular','Segoe UI','sans-serif'")
                .attr("fill", "black");
            txt.append("tspan").attr("x", textPosX).attr("style", "font-weight:bold")
                .html((d: RiskItem) => d.Title);

            txt.append("tspan").attr("dy", 22).attr("x", textPosX)
                .html((d: RiskItem) => d.Text);

            txt.append("tspan").attr("dy", 22).attr("x", textPosX)
                .html((d: RiskItem) => `Alvorlighetsgrad: ${d.Consequence}`);

            txt.append("tspan").attr("dy", 22).attr("x", textPosX)
                .html((d: RiskItem) => `Sannsynlighet: ${d.Probability}`);

            txt.append("tspan").attr("dy", 22).attr("x", textPosX).attr("style", "font-weight:bold")
                .html((d: RiskItem) => `Sum Risiko: ${d.getSum(__)}`);
            if (__.SHOW_LEGEND) {
                d3.select(".riskSVG")
                    .append("g").call(d3["svg"].axis()["scale"](xScale).orient("top").ticks(5))
                    .attr("fill", "none")
                    .attr("stroke", "#333").attr("stroke-width", "1")
                    .attr("shape-rendering", "crispEdges")
                    .append("g").call(d3["svg"].axis()["scale"](yScale).orient("left").ticks(5))
                    .attr("fill", "none")
                    .attr("stroke", "#333")
                    .attr("shape-rendering", "crispEdges");
            }
            svg.selectAll("path, line, text")
                .attr("stroke", "none");

            svg.selectAll("text")
                .attr("fill", __CONFIG.TEXT_BLUE);

            $__container.fadeTo("fast", 1);
        });
    };

    /**
     * Handle resize
     */
    function HandleResize(): void {
        let $__container = jQuery(__CONFIG.CONTAINER);
        let rtime,
            timeout = false,
            delta = 200;

        jQuery(window).resize(() => {
            rtime = new Date();
            if (timeout === false) {
                timeout = true;
                setTimeout(_resizeend, delta);
            }
        });

        function _resizeend() {
            if (<any>new Date() - rtime < delta) {
                setTimeout(_resizeend, delta);
            } else {
                timeout = false;
                RenderMatrix();
            }
        };
    };

    /**
     * Initializes the Risk Matrix
     */
    function _init(): void {
        let $__container = jQuery(__CONFIG.CONTAINER);
        $__container.css("transition", "all .3s");
        HandleResize();
        RenderMatrix();
        RenderViewSelector();

        jQuery(__CONFIG.POST_ACTION_CHECKBOX).change(event => {
            RenderMatrix(__CURRENT_VIEW, event.target.checked);
        });
    };

    ExecuteOrDelayUntilBodyLoaded(_init);
};
