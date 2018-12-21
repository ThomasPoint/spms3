import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

class App extends Component {

    constructor(props) {
        super(props);
        let portfoliosHistory = [];
        let nbPortfolio = 0;

        this.state = {
            portfolios: portfoliosHistory,
            curNumberPortfolio: nbPortfolio,
        };
    }

    // --------- function used to manage local storage
    saveAppState() {
        localStorage.setItem("appState", JSON.stringify(this.state))
    }

    componentDidMount()  {
        this.setState(JSON.parse(localStorage.getItem("appState")));

        // adding an event listener that will help us save the state of the app when the
        // user wants to leave or refresh the application
        window.addEventListener("beforeunload", this.saveAppState.bind(this));
    }

    componentWillUnmount() {
        window.removeEventListener("beforeunload", this.saveAppState.bind(this));
        // save the state of the app just before the app component will disapear
        this.saveAppState();
    }
    // ------------- end function to manage local storage
    eachPortfolios = (portfolio, index) => {
        return (<Portfolio name={portfolio}
                           key={index}
                           index={index}
                           remove={(index) =>  this.removePortfolio(index)}/>)
            ;
    };

    addPortfolio = () => {
        if ( this.state.curNumberPortfolio <10) {
            let createdPortfolio = document.getElementById("portfolio_name").value;
            if(createdPortfolio === "") {
                alert("Please give a name!")
            } else {
                let listPortfolio = this.state.portfolios;
                listPortfolio.push(createdPortfolio);
                let nbPortfolioTmp = this.state.curNumberPortfolio + 1;

                this.setState({
                    portfolios : listPortfolio,
                    curNumberPortfolio:nbPortfolioTmp
                });
            }


        } else {
            alert("The maximun number of portfolios is 10 !")
        }
    };

    removePortfolio = (index) => {
        let listPortfolio = this.state.portfolios;
        listPortfolio.splice(index,1);
        let nbPortfolio = this.state.curNumberPortfolio -1;

        // we remove the portfolio from the local storage
        localStorage.removeItem("portfolioState"+index);
        this.setState({
            portfolios: listPortfolio,
            curNumberPortfolio: nbPortfolio
        });
    };

    render() {
        return (
            <div className="">
                <div className="col-4 col-centered">
                    <div className="input-group input-group-sm mb-3 mt-3 ml-3" style={{width: '30rem' }}>
                        <div className="input-group-prepend">
                            <span className="input-group-text" id="inputGroup-sizing-sm">Portfolio Name</span>
                        </div>
                        <input id="portfolio_name" type="text" className="form-control rounded" aria-label="Sizing example input"
                               aria-describedby="inputGroup-sizing-sm"/>
                        <button onClick={() => this.addPortfolio()} className="btn btn-primary btn-sm ml-4 mr-4">Add Portfolio</button>
                    </div>

                    <div>
                        {
                            this.state.portfolios.map(this.eachPortfolios)
                        }
                    </div>
                </div>
            </div>
        );
    }
}

class Portfolio extends Component{

    constructor(props) {
        super(props);
        this.state = {
            listStock: [],
            nbStock:0,
            isAddingStock: false,
            totalValue:0,
            currency: "$"
        }
    }

    // --------- function used to manage local storage
    savePortfolioState() {
        let idPortfolio = "portfolioState" + this.props.index;
        localStorage.setItem(idPortfolio, JSON.stringify(this.state))
    }
    //
    componentDidMount()  {
        let idPortfolio = "portfolioState" + this.props.index;
        this.setState(JSON.parse(localStorage.getItem(idPortfolio)));

        if (this.state.currency ==="$") {
            if(document.getElementById("dollar"+this.props.index) !== null) {
                document.getElementById("dollar" + this.props.index).disabled = true;
            }
        } else if (this.state.currency ==="€") {
            if(document.getElementById("euros"+this.props.index)) {
                document.getElementById("euros"+this.props.index).disabled = true;
            }

        }
    }

    componentDidUpdate() {
        if (this.state.currency ==="$") {
            if(document.getElementById("dollar"+this.props.index) !== null) {
                document.getElementById("dollar"+this.props.index).disabled = true;
            }
        } else if (this.state.currency ==="€") {
            if (document.getElementById("euros"+this.props.index) !== null) {
                document.getElementById ("euros"+this.props.index).disabled = true;
            }
        }
    }

    // ------------- end function to manage local storage


    showStockForm() {
        this.setState({isAddingStock: true});
    }
    // this method help us to add a stock to a portfolio
    addStockToPortfolio() {
        if (this.state.nbStock < 50 ||
            typeof (this.state.listStock.find(s => s.symbol === this.refs.symbol.value) !== 'undefined')) {

            let newStockSymbole = this.refs.symbol.value;
            let newStockNbShares = this.refs.sharesNumber.value;

            let curNbStock = this.state.nbStock;
            let curStocks = this.state.listStock;
            let totValue = this.state.totalValue;

            //First api call to get all the existing symbols
            fetch('https://api.iextrading.com/1.0/ref-data/symbols')
                .then(result => {
                    return result.json();
                }).then(data => {
                // We check that the requested symbol exist in the list
                if (typeof(data.find(d => d["symbol"] ===  newStockSymbole) !== 'undefined')) {
                    // API call to get the unit price of the stock
                    fetch('https://api.iextrading.com/1.0/tops/last?symbols=' + newStockSymbole)
                        .then(res => {
                            return res.json();
                        }).then(dt => {
                        let unit_price = dt[0]["price"];
                        // This if statement check if the new symbol already exists in the portfolio
                        // if no, we increment by one the number of stock
                        // otherwise we let it unchanged
                        if (typeof (curStocks.find(s => s.symbol === newStockSymbole)) === 'undefined') {
                            curNbStock++;
                        }
                        // we get the unit price in $ from the API, if the currency is in euro we need to
                        // convert it : to do so we alter the unit price
                        if(this.state.currency === "€") {
                            fetch('https://api.exchangeratesapi.io/latest?symbols=USD')
                                .then(res => {
                                    return res.json();
                                }).then(data => {
                                let exchangeRate = data["rates"]["USD"];
                                unit_price /= exchangeRate;

                                // we add the new stock to the list
                                curStocks.push({symbol: newStockSymbole,
                                    shares: newStockNbShares,
                                    unitPrice: unit_price,
                                    totalPrice: unit_price*newStockNbShares});
                                totValue += unit_price*newStockNbShares;
                                // save state once the adding is performed
                                this.setState({isAddingStock:false, listStock : curStocks, nbStock:curNbStock, totalValue:totValue},
                                    () => {
                                        this.savePortfolioState();
                                    });

                            })
                        } else if(this.state.currency ==="$") {
                            // we add the new stock to the list
                            curStocks.push({symbol: newStockSymbole,
                                shares: newStockNbShares,
                                unitPrice: unit_price,
                                totalPrice: unit_price*newStockNbShares});
                            totValue += unit_price*newStockNbShares;
                            // save state once the adding is performed
                            this.setState({isAddingStock:false, listStock : curStocks, nbStock:curNbStock, totalValue:totValue},
                                () => {
                                    this.savePortfolioState();
                                });
                        }


                    })
                        .catch(err => alert("The symbol you want to add does not exist in the database"));
                }
            })


        } else {
            alert("Your portfolio already contains the maximum number of stock (50)");
        }

    }

    deleteStock = (index) => {
        let curStocks = this.state.listStock;

        // we substract the price of the removed stock
        let tmpTotValue = this.state.totalValue;
        tmpTotValue -= curStocks[index]["totalPrice"];
        console.log(tmpTotValue);
        curStocks.splice(index,1);

        let curNbStock = this.state.nbStock;
        curNbStock -= 1;
        console.log(curNbStock);

        // setState is asynchronous : https://www.freecodecamp.org/forum/t/update-localstorage-after-setstate-react/167754/4
        // we use the callback function to save the state of the portfolios once the state has been updated
        this.setState({listStock:curStocks, nbStock:curNbStock, totalValue:tmpTotValue},
            () => {
                this.savePortfolioState();
            });

    };

    cancelAddingStock() {
        this.setState({isAddingStock:false});
    }


    eachStock = (stock, index) => {
        return( <Stock symbol={stock.symbol}
                       shares={stock.shares}
                       unitPrice={stock.unitPrice}
                       totalPrice={stock.totalPrice}
                       key={index}
                       index={index}
                       deleteStock = {(index) => this.deleteStock(index)}/>
        )
    };



    renderStockForm () {
        return (
            <div >
                <h2 className="ml-3">Stock Form</h2>
                <div className="input-group input-group-sm mb-3 mt-3 ml-3" style={{width: '30rem' }}>
                    <div className="input-group-prepend">
                        <span className="input-group-text" id="inputGroup-sizing-sm">Symbol</span>
                    </div>
                    <input id={"symbol"} ref={"symbol"} type="text" className="form-control" aria-label="Sizing example input"
                           aria-describedby="inputGroup-sizing-sm"/>
                </div>
                <div className="input-group input-group-sm mb-3 mt-3 ml-3" style={{width: '30rem' }}>
                    <div className="input-group-prepend">
                        <span className="input-group-text" id="inputGroup-sizing-sm">Number of shares</span>
                    </div>
                    <input id={"sharesNumber"} ref={"sharesNumber"} type="number" className="form-control" aria-label="Sizing example input"
                           aria-describedby="inputGroup-sizing-sm"/>
                </div>
                <button onClick={() => this.addStockToPortfolio()} className="btn btn-success btn-sm ml-3 mr-4">Save</button>
                <button onClick={() => this.cancelAddingStock()} className="btn btn-danger btn-sm">Cancel</button>
            </div>
        )
    }

    renderPortfolio() {
        return(
            <div className="card mt-3" style={{width: '30rem' }}>
                <div className="card-body">
                    <h2 className="card-title">{this.props.name}</h2>
                    <div>
                        <button id={"euros"+this.props.index} onClick={() => this.showInEuro()} className="btn btn-link btn-sm mr-4">Show in €</button>
                        <button id={"dollar"+this.props.index} onClick={() => this.showInDollar()} className="btn btn-link btn-sm mr-4" >Show in $</button>
                    </div>

                    <div>
                        <table className="table table-scroll">
                            <thead>
                            <tr>
                                <th scope="col">Stock Name</th>
                                <th scope="col">Unit Val ({this.state.currency})</th>
                                <th scope="col">Qty</th>
                                <th scope="col">Tot Val ({this.state.currency})</th>
                                <th></th>
                            </tr>
                            </thead>
                            <tbody>
                            {this.state.listStock.map(this.eachStock)}
                            </tbody>
                        </table>
                    </div>
                    <p>Portfolio total value : {Number(this.state.totalValue).toFixed(2)} {this.state.currency}</p>
                    <div>
                        <button onClick={()=> this.showStockForm()} className="btn btn-secondary btn-sm mr-4">Add Stock</button>
                        <button className="btn btn-secondary btn-sm mr-4">Graph Analysis</button>
                        <button onClick={() => this.props.remove(this.props.index)} className="btn btn-secondary btn-sm mr-4">Remove portfolio</button>
                    </div>
                </div>
            </div>
        );
    }

    showInDollar = () => {
        // we do not perform the conversion if the currency is already in $
        document.getElementById ("dollar"+this.props.index).disabled = true;
        document.getElementById ("euros"+this.props.index).disabled = false;
        if(this.state.currency === "$"){
            return;
        }
        fetch('https://api.exchangeratesapi.io/latest?symbols=USD')
            .then(res => {
                return res.json();
            }).then(data => {
            let exchangeRate = data["rates"]["USD"];
            let stocks = this.state.listStock;
            let totVal = 0;

            stocks.forEach(stock => {
                stock["unitPrice"] *= exchangeRate;
                stock["totalPrice"] *= exchangeRate;
                totVal += stock["totalPrice"];
            });

            this.setState({currency: "$", totalValue:totVal},
                () => {
                    this.savePortfolioState();
                });

        })
            .catch(err => alert("The symbol you want to add does not exist in the database"));
    };

    showInEuro = () => {
        document.getElementById("dollar"+this.props.index).disabled = false;
        document.getElementById("euros"+this.props.index).disabled = true;
        if(this.state.currency === "€"){
            return;
        }
        fetch('https://api.exchangeratesapi.io/latest?symbols=USD')
            .then(res => {
                return res.json();
            }).then(data => {
            let exchangeRate = data["rates"]["USD"];
            let stocks = this.state.listStock;
            let totVal = 0;

            stocks.forEach(stock => {
                stock["unitPrice"] /= exchangeRate;
                stock["totalPrice"] /= exchangeRate;
                totVal += stock["totalPrice"];
            });

            this.setState({currency: "€", totalValue:totVal},
                () => {
                    this.savePortfolioState();
                });
        })
            .catch(err => alert("The symbol you want to add does not exist in the database"));
    };

    render() {
        // allow us to know if we have to render the form to add a stock or the portfolios
        if (this.state.isAddingStock) {
            return this.renderStockForm()
        } else {
            return this.renderPortfolio()
        }
    }
}

class Stock extends Component {
    render(){
        return(
            <tr>
                <td>{this.props.symbol}</td>
                <td>{Number(this.props.unitPrice).toFixed(2)}</td>
                <td>{this.props.shares}</td>
                <td>{Number(this.props.totalPrice).toFixed(2)}</td>
                <td><button className="btn btn-outline-danger btn-sm" onClick={() => this.props.deleteStock(this.props.index)}>Delete Stock</button></td>
            </tr>
        )
    }
}

export default App;
