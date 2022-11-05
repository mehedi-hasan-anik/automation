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
  const [returnShow, setReturnShow] = useState(false);
  const [returnConfirmShow, setReturnConfirmShow] = useState(false);
  const [fromDate, setFromDate] = useState(null);
  const [toDate, settoDate] = useState(null);
  const [differnceTime, setDiffernceTime] = useState(null);
  const [selectedData, setSelectedData] = useState(null);
  const [totalPrice, setTotalPrice] = useState(null);
  const [BookedTotalPrice, setBookedTotalPrice] = useState(null);
  const [bookedProducts, setBookedProducts] = useState(null);
  const [removingReturnedProduct, setRemovingReturnProduct] = useState(null);
  const [mileage, setMileage] = useState(null);
  const [reload, setReload] = useState(false);

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
    const bookedProducts = JSON.parse(localStorage.getItem("cart"));
    setRowData(tableData);
    if (bookedProducts) {
      setBookedProducts(bookedProducts);
    }
  }, [reload]);

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

  const handleReturnClose = () => setReturnShow(false);
  const handleReturnShow = () => setReturnShow(true);

  const handleReturnConfirmClose = () => setReturnConfirmShow(false);
  const handleReturnConfirmShow = () => setReturnConfirmShow(true);

  const handleNameChange = (e) => {
    const result = tableData.find(
      (element) => String(element.code) === String(e.target.value)
    );
    setSelectedData(result);
  };

  const handleMileageChange = (e) => {
    const result = bookedProducts.find(
      (element) => String(element?.product?.code) === String(e.target.value)
    );
    setMileage(result?.product?.mileage);
    setBookedTotalPrice(result?.totalPrice);
    setRemovingReturnProduct(result?.productId);
  };

  const handleRemoveReturnProduct = (productId) => {
    const finalProducts = bookedProducts.filter(
      (el) => el.productId !== productId
    );
    localStorage.setItem("cart", JSON.stringify(finalProducts));
    alert("Successfully returned the product");
    setReload((prev) => !prev);
  };

  const handleFromChange = (e) => {
    setFromDate(e.target.value);
  };
  const handleToChange = (e) => {
    settoDate(e.target.value);
  };

  // random product id generator
  function generateRandomId() {
    var length = 6,
      text = "abcdefghijklmnopqrstuvwxyz0123456789",
      randomId = "";
    for (var i = 0, n = text.length; i < length; ++i) {
      randomId += text.charAt(Math.floor(Math.random() * n));
    }
    return randomId;
  }

  // Confirm book
  const confirmBook = () => {
    const orderedBook = {};
    orderedBook.productId = generateRandomId();
    orderedBook.product = selectedData;
    orderedBook.fromDate = fromDate;
    orderedBook.toDate = toDate;
    orderedBook.totalPrice = totalPrice;

    const existingBook = localStorage.getItem("cart");
    if (existingBook) {
      const parsedExistingBook = JSON.parse(existingBook);
      for (const booking of parsedExistingBook) {
        if (booking.product.code === orderedBook.product.code) {
          if (
            new Date(booking.fromDate) <= new Date(orderedBook.fromDate) &&
            new Date(booking.toDate) >= new Date(orderedBook.toDate)
          ) {
            alert("Date already has booked");
            return;
          }
        }
      }
      parsedExistingBook.push(orderedBook);
      localStorage.setItem("cart", JSON.stringify(parsedExistingBook));
      alert("Product booked successfully");
    } else {
      localStorage.setItem("cart", JSON.stringify([orderedBook]));
      alert("Product booked successfully");
    }
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
            <Button
              onClick={() => confirmBook()}
              className="me-2"
              variant="primary"
            >
              Yes
            </Button>
            <Button className="" variant="primary">
              No
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal show={returnShow} onHide={handleReturnClose}>
          <Modal.Header closeButton>
            <Modal.Title>Return a Product</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <select
              id=""
              name=""
              className="form-control"
              onChange={handleMileageChange}
            >
              <option value="volvo">select</option>
              {bookedProducts?.map((item, index) => (
                <option key={index} value={item?.product?.code}>
                  {item?.product.name} - {item.productId}
                </option>
              ))}
            </select>
            <br />
            <p>{mileage ? "Mileage - " + mileage : ""}</p>
          </Modal.Body>
          <Modal.Footer>
            <Button
              onClick={handleReturnConfirmShow}
              className="me-2"
              variant="primary"
            >
              Yes
            </Button>
            <Button className="" variant="primary">
              No
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal show={returnConfirmShow} onHide={handleReturnConfirmClose}>
          <Modal.Header closeButton>
            <Modal.Title>Return a Product</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>Your total price is ${BookedTotalPrice}</p>
            <p>Do you want to procedure</p>
          </Modal.Body>
          <Modal.Footer>
            <Button
              onClick={() => handleRemoveReturnProduct(removingReturnedProduct)}
              className="me-2"
              variant="primary"
            >
              Confirm
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
                <label htmlFor="From">From:</label>
                <input
                  className="form-control"
                  type="date"
                  id="From"
                  name="From"
                  onChange={handleFromChange}
                />
              </div>
              <div className="toDate">
                <label htmlFor="To">To:</label>
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
          <Button className="me-2" variant="primary" onClick={handleReturnShow}>
            Return
          </Button>
        </div>
      </div>
    </div>
  );
};

export default App;
