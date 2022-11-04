import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { AgGridReact } from "ag-grid-react";
import { useCallback, useEffect, useRef, useState } from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import "./App.css";
import tableData from "./data/table.json";

const App = () => {
  const [rowData, setRowData] = useState(null);
  const gridRef: any = useRef();
  const [bookShow, setBookShow] = useState(false);
  const [priceShow, setPriceShow] = useState(false);
  const [fromDate, setFromDate] = useState(null);
  const [toDate, settoDate] = useState(null);
  const [differnceTime, setDiffernceTime] = useState(null);
  const [selectedData, setSelectedData] = useState(null);
  const [totalPrice, setTotalPrice] = useState(null);

  useEffect(() => {
    var date1 = new Date(fromDate);
    var date2 = new Date(toDate);
    if (toDate != null) {
      var diffTime = Math.abs(date2 - date1);
      var diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDiffernceTime(diffDays);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    setRowData(tableData);
  }, []);

  useEffect(() => {
    if (differnceTime != null) {
      var totalPrice = selectedData?.price * differnceTime;
      setTotalPrice(totalPrice);
    }
  }, [differnceTime, selectedData]);

  const [columnDefs] = useState([
    { field: "name" },
    { field: "code" },
    { field: "availability" },
    { field: "needing_repair" },
    { field: "durability" },
    { field: "mileage" },
    { field: "price" },
  ]);

  const onFilterTextBoxChanged = useCallback(() => {
    var gridApi = gridRef.current;
    var searchField = document.getElementById("filter-text-box");
    gridApi.api.setQuickFilter(searchField.value);
  }, []);

  const handleClose = () => setBookShow(false);
  const handleShow = () => setBookShow(true);

  const handlePriceClose = () => setPriceShow(false);
  const handlePriceShow = () => setPriceShow(true);

  const handleNameChange = (e) => {
    const result = tableData.find(
      (element) => String(element.code) === String(e.target.value)
    );
    setSelectedData(result);
  };

  const handleFromChange = (e) => {
    setFromDate(e.target.value);
  };
  const handleToChange = (e) => {
    settoDate(e.target.value);
  };

  return (
    <div className="App">
      <>
        <Modal show={priceShow} onHide={handlePriceClose}>
          <Modal.Header closeButton>
            <Modal.Title>Book a Product</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>Your estimated price ${totalPrice}</p>
            <p>Do you want to procedure</p>
          </Modal.Body>
          <Modal.Footer>
            <Button className="me-2" variant="primary">
              Yes
            </Button>
            <Button className="" variant="primary">
              No
            </Button>
          </Modal.Footer>
        </Modal>
        <Modal show={bookShow} onHide={handleClose}>
          <Modal.Header closeButton>
            <Modal.Title>Book a Product</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <select
              id="cars"
              name="cars"
              className="form-control"
              onChange={handleNameChange}
            >
              <option value="volvo">select</option>
              {tableData?.map((item, index) => (
                <option key={index} value={item?.code}>
                  {item?.name}
                </option>
              ))}
            </select>
            <div className="date d-flex gap-5 mt-2">
              <div className="fromDate">
                <label for="From">From:</label>
                <input
                  className="form-control"
                  type="date"
                  id="From"
                  name="From"
                  onChange={handleFromChange}
                />
              </div>
              <div className="toDate">
                <label for="To">To:</label>
                <input
                  className="form-control"
                  type="date"
                  id="To"
                  name="To"
                  onChange={handleToChange}
                />
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button
              className="me-2"
              variant="primary"
              onClick={handlePriceShow}
            >
              Yes
            </Button>
            <Button className="" variant="primary">
              No
            </Button>
          </Modal.Footer>
        </Modal>
      </>
      <div className="ag-theme-alpine" style={{ height: 400, maxWidth: 800 }}>
        <input
          className="form-control w-25 mb-2"
          type="text"
          id="filter-text-box"
          placeholder="Filter..."
          onInput={onFilterTextBoxChanged}
        />
        <AgGridReact
          ref={gridRef}
          rowData={rowData}
          columnDefs={columnDefs}
        ></AgGridReact>
        <div className="text-end mt-2">
          <Button className="me-2" variant="primary" onClick={handleShow}>
            Book
          </Button>
          <button className="btn btn-primary">Return</button>
        </div>
      </div>
    </div>
  );
};

export default App;
