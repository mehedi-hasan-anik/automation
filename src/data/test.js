import { DragStartedEvent, DragStoppedEvent, GridReadyEvent } from 'ag-grid-community'
import 'ag-grid-community/dist/styles/ag-grid.css'
import { AgGridColumn, AgGridReact } from 'ag-grid-react'
import cogoToast from 'cogo-toast'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Dropdown } from 'react-bootstrap'
import 'react-bootstrap-table2-toolkit/dist/react-bootstrap-table2-toolkit.min.css'
import { useDispatch, useSelector } from 'react-redux'
import CustomModal from '../../../common/components/CustomModal'
import Validate from '../../../helpers/validate/validate'
import useTableHook from '../../../hooks/use-table-hook'
import type { RootState } from '../../../redux'
import { updateOrderList } from '../../../redux/slices/orderList'
import { updateTradeListColumnShow } from '../../../redux/slices/tradeListColumnShow'
import BuySellModalBody from '../buy-sell-modal/BuySellModalBody'
import BuySellModalFooter from '../buy-sell-modal/BuySellModalFooter'
import { TABLE_INIT_VALUE } from '../constants'
import TradingInterface from '../types/trading-list'
import {
    OrderList,
    UserAccProfit,
    all_user_bo_info,
    ask_sell_trade,
    bit_buy_sell,
    buy_sell_bit
} from './../../auth/core/_requests'
import CheckList from './CheckList'

const INIT_BUY_SELL_API: TradingInterface = {
  bid_user: '',
  scrip: '',
  bid_price: 0,
  remain_qty: 0,
}

const contains = (target, lookingFor) => {
  return target && target.indexOf(lookingFor) >= 0
}

var columnFilterParams = {
  filterOptions: ['contains'],
  textMatcher: ({value, filterText}) => {
    var filterTextLowerCase = filterText ? filterText.toLowerCase() : ''
    var valueLowerCase = value.toString().toLowerCase()
    var aliases = {
      usa: 'united states',
      holland: 'netherlands',
      vodka: 'russia',
      niall: 'ireland',
      sean: 'south africa',
      alberto: 'mexico',
      john: 'australia',
      xi: 'china',
    }
    var literalMatch = contains(valueLowerCase, filterTextLowerCase)
    return !!literalMatch || !!contains(valueLowerCase, aliases[filterTextLowerCase])
  },
  trimInput: true,
  debounceMs: 1000,
}

function useDragColumnChange(cb: (e: DragStoppedEvent) => void) {
  const columnOrderRef = useRef<string[]>([])
  const onDragStarted = (e: DragStartedEvent) => {
    columnOrderRef.current = e.columnApi.getColumnState().map((c) => c.colId)
  }
  const onDragStopped = (e: DragStoppedEvent) => {
    const newColumnOrder = e.columnApi.getColumnState().map((c) => c.colId)
    const sameOrder = columnOrderRef.current.every((c, i) => c === newColumnOrder[i])

    if (!sameOrder) {
      cb(e)
    }
  }

  return {onDragStarted, onDragStopped}
}
/**
 * Trading List
 * @returns
 */
const TradingList: React.FC = () => {
  const dispatch = useDispatch()
  const {userData, tradeListData} = useSelector((state: RootState) => state)
  const {checkData, handleCheckData} = useTableHook({
    initData: TABLE_INIT_VALUE,
  })

  // States
  const [data, setData] = useState({})
  const [isBuy, setIsBuy] = useState(true)
  const [isShow, setIsShow] = useState(false)
  const [tradeList, setTradeList] = useState(false)
  const [modalData, setModalData] = useState<any>(null)
  const [clientCode, setClientCode] = useState<string>('')
  const [boAccountData, setBoAccountData] = useState<any>([])
  const [buySellApi, setBuySellApi] = useState<any>(INIT_BUY_SELL_API)
  const [profitLIST, setprofitLIST] = useState<any>([])

  // Refs
  const gridRef: any = useRef()

  // Actions
  const handleModalClose = () => {
    setIsShow(false)
    setBuySellApi(INIT_BUY_SELL_API)
    setClientCode('')
  }
  window.onclick = function (event) {
    if (tradeList) {
      setTradeList(!tradeList)
    }
  }

  const apiRef = useRef<any>({
    grid: undefined,
    column: undefined,
  })

  const fetchData = async (data) => {
    try {
      let getData: any = await buy_sell_bit(data?.scrip)
      setData(getData.data.data)

      let bo = await all_user_bo_info()
      setBoAccountData(bo.data.data)
    } catch (error) {
      console.error(error)
    }
  }

  const onCellClicked = (params: any) => {
    setIsShow(true)
    setModalData(params?.data)
    fetchData(params?.data)
  }

  const onGridReady = (params: GridReadyEvent) => {
    apiRef.current.grid = params.api
    apiRef.current.column = params.columnApi
  }

  const {onDragStarted, onDragStopped} = useDragColumnChange((e) =>
    console.log('Saving new column order!')
  )

  useEffect(() => {
    dispatch(updateTradeListColumnShow(checkData))
  }, [checkData, dispatch])

  const defaultColDef = {
    sortable: true,
    enableCellChangeFlash: true,
  }

  const onFilterTextBoxChanged = useCallback(() => {
    var gridApi: any = gridRef.current
    var searchField: any = document.getElementById('filter-text-box')
    gridApi.api.setQuickFilter(searchField.value)
  }, [])

  const onBtnExport = useCallback(() => {
    gridRef.current.api.exportDataAsCsv()
  }, [])
  // prettier-ignore
  const handleSubmit = async (event: any) => {
    event.preventDefault()

    let validate: boolean = false
    buySellApi.bid_user = userData.id
    buySellApi.scrip = modalData?.scrip

    const validateBidPrice = new Validate('bid_price', buySellApi.bid_price, {min: 1})
    const validateBidQty = new Validate('remain_qty', buySellApi.remain_qty, {min: 1})
    const validatePriceType = new Validate('price_type', buySellApi.price_type)
    const validateDpCode    = new Validate('dp_code', buySellApi.dp_code)
    const validateScrip     = new Validate('scrip', buySellApi.scrip)
    const validateBoNo      = new Validate('bo_no', buySellApi.bo_no)
    const validateBoId      = new Validate('bo_id', buySellApi.bo_id)

    const bid_price = validateBidPrice.number().required().min()
    const remain_qty = validateBidQty.number().required().min()
    const price_type = validatePriceType.string().required()
    const dp_code    = validateDpCode.string().required()
    const scrip      = validateScrip.string().required()
    const bo_no      = validateBoNo.number().required()
    const bo_id      = validateBoId.number().required()

    if (
      !(
        bid_price.error.length &&
        remain_qty.error.length &&
        scrip.error.length &&
        dp_code.error.length &&
        bo_no.error.length &&
        bo_id.error.length &&
        price_type.error.length
      )
    ) {
      validate = true
    } else {
      cogoToast.error('Required field missing!', {position: 'top-right'})
    }

    if (!validate) return
    if (isBuy) {
      delete buySellApi?.ask_price
      delete buySellApi?.ask_qty

      let res = await bit_buy_sell({...buySellApi, bid_qty: buySellApi.remain_qty})

      if (res.data.status === 200 || res.data.status === 201) {
        // setBuySellApi(clientCodeBuy)
        fetchData(modalData)
        setBuySellApi(INIT_BUY_SELL_API)
        setClientCode('')
        cogoToast.success('Buy is successful', {position: 'top-right'})
      } else {
        cogoToast.error('Something went wrong', {position: 'top-right'})
      }
    } else {
      const updatedState = {
        ...buySellApi,
        ask_price: buySellApi.bid_price,
        ask_qty: buySellApi.remain_qty,
      }
      delete updatedState?.bid_price
      delete updatedState?.remain_qty

      let res = await ask_sell_trade(updatedState)
      // update state to init value
      setBuySellApi(INIT_BUY_SELL_API)
      setClientCode('')

      if (res.data.status === 200 || res.data.status === 201) {
        // setBuySellApi(clientCodeSell)
        fetchData(modalData)
        // update redux data
        const orderlist: any = await OrderList()
        dispatch(updateOrderList(orderlist.data?.data))

        cogoToast.success('Sell is successful', {position: 'top-right'})
      } else {
        cogoToast.error('Something went wrong', {position: 'top-right'})
      }
    }
  }

  const handleSwitchChange = () => {
    setIsBuy((prevState) => !prevState)
  }

  const handleClientCodeChange = async (e) => {
    setClientCode(e.target.value)
    let data = e.target.value.split('-')
    const list: any = await UserAccProfit(data[0])

    setprofitLIST(list.data)
    setBuySellApi((prevState) => ({
      ...prevState,
      dp_code: data[2],
      bo_no: parseInt(data[1]),
      bo_id: parseInt(data[0]),
      price_type: 'price_limit',
    }))
  }

  if (!userData || !tradeListData.data.length) return <div>Loading</div>

  return (
    <>
      <CustomModal
        title='Trading'
        handleClose={handleModalClose}
        show={isShow}
        footer={
          <BuySellModalFooter
            isBuy={isBuy}
            handleClose={handleModalClose}
            handleSubmit={handleSubmit}
            bid_price={0}
          />
        }
      >
        <BuySellModalBody
          isBuy={isBuy}
          setIsBuy={setIsBuy}
          buySellApi={buySellApi}
          setBuySellApi={setBuySellApi}
          boAccountData={boAccountData}
          clientCode={clientCode}
          handleClientCodeChange={handleClientCodeChange}
          handleSwitchChange={handleSwitchChange}
          modalData={modalData}
          data={data}
          userProfit={profitLIST}
        />
      </CustomModal>
      <div className='trading-table'>
        <div className='price-list-header px-3 py-2'>
          <div className='search-bar me-5'>
            <div className='example-header'>
              <input
                className='form-control'
                type='text'
                id='filter-text-box'
                placeholder='Filter...'
                onInput={onFilterTextBoxChanged}
              />
            </div>
          </div>
          <div className='d-flex justify-content-center align-items-center gap-2 tradingListHeaderRight'>
            <button className='downloadCsv' onClick={onBtnExport} title='Export Report'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='24'
                height='24'
                viewBox='0 0 24 24'
                fill='none'
              >
                <rect
                  opacity='0.3'
                  x='12.75'
                  y='4.25'
                  width='12'
                  height='2'
                  rx='1'
                  transform='rotate(90 12.75 4.25)'
                  fill='currentColor'
                />
                <path
                  d='M12.0573 6.11875L13.5203 7.87435C13.9121 8.34457 14.6232 8.37683 15.056 7.94401C15.4457 7.5543 15.4641 6.92836 15.0979 6.51643L12.4974 3.59084C12.0996 3.14332 11.4004 3.14332 11.0026 3.59084L8.40206 6.51643C8.0359 6.92836 8.0543 7.5543 8.44401 7.94401C8.87683 8.37683 9.58785 8.34458 9.9797 7.87435L11.4427 6.11875C11.6026 5.92684 11.8974 5.92684 12.0573 6.11875Z'
                  fill='currentColor'
                />
                <path
                  d='M18.75 8.25H17.75C17.1977 8.25 16.75 8.69772 16.75 9.25C16.75 9.80228 17.1977 10.25 17.75 10.25C18.3023 10.25 18.75 10.6977 18.75 11.25V18.25C18.75 18.8023 18.3023 19.25 17.75 19.25H5.75C5.19772 19.25 4.75 18.8023 4.75 18.25V11.25C4.75 10.6977 5.19771 10.25 5.75 10.25C6.30229 10.25 6.75 9.80228 6.75 9.25C6.75 8.69772 6.30229 8.25 5.75 8.25H4.75C3.64543 8.25 2.75 9.14543 2.75 10.25V19.25C2.75 20.3546 3.64543 21.25 4.75 21.25H18.75C19.8546 21.25 20.75 20.3546 20.75 19.25V10.25C20.75 9.14543 19.8546 8.25 18.75 8.25Z'
                  fill='#C4C4C4'
                />
              </svg>
            </button>
            <Dropdown>
              <Dropdown.Toggle id='dropdown-basic' className='settingsToggle' title='settings'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                  strokeWidth='1.5'
                  stroke='currentColor'
                  className='w-6 h-6'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z'
                  />
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                  />
                </svg>
              </Dropdown.Toggle>

              <Dropdown.Menu>
                {checkData &&
                  checkData.map((check) => (
                    <CheckList key={check.id} check={check} handleCheckData={handleCheckData} />
                  ))}
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </div>
        <div style={{height: '73vh'}}>
          <div style={{height: '100%', width: '100%'}} className='ag-theme-balham'>
            <AgGridReact
              ref={gridRef}
              defaultColDef={defaultColDef}
              rowSelection='multiple'
              suppressRowClickSelection
              onDragStarted={onDragStarted}
              onDragStopped={onDragStopped}
              onGridReady={onGridReady}
              rowData={tradeListData?.data}
              pagination={false}
              cacheQuickFilter={true}
              onCellClicked={onCellClicked}
            >
              {checkData && <AgGridColumn headerName='ID' field='id' width={50} />}

              {checkData &&
                checkData.map((data) => {
                  if (!data.checked) return null
                  return (
                    <AgGridColumn
                      key={data.id}
                      filter='agTextColumnFilter'
                      filterParams={columnFilterParams}
                      headerName={data.checked ? data.title : ''}
                      field={data.checked ? data.value : ''}
                      headerTooltip={data.title}
                      width={data.width}
                    />
                  )
                })}
            </AgGridReact>
          </div>
        </div>
      </div>
    </>
  )
}
export default TradingList
