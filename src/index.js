// https://github.com/vipinkrishna

import React, { Component } from 'react'
import { render } from 'react-dom'
import { createStore, applyMiddleware, compose } from 'redux'
import {Provider, connect} from 'react-redux'
import createSagaMiddleware from 'redux-saga'
import {delay, call, takeEvery, takeLatest, put, select, all} from 'redux-saga/effects'
import './index.scss'



//INITIAL STATE
const initialState = {
  department: null,
  employee: null,
  departments: ["HR", "ENGINEERS"],
  hrs: [1,2,3,4,5],
  engineers: [6,7,8,9],
  list: [1,2,3,4,5],
  data: null,
  showDetails: false
}




//REDUCER
const reducer = function(state=initialState, {type, payload}) {
  const newState = {...state}
  switch(type) {
    case "UPDATE_DEPARTMENT_AND_EMPLOYEE":
      return {...state, ...payload}
    case "UPDATE_DEPARTMENT_ASYNC":
      return {...state, ...payload}
    case "UPDATE_EMPLOYEE":
      return {...state, ...payload}
    case "UPDATE_DATA_ASYNC":
      return {...state, ...payload}
    case "CLEAR":
      return {...state, ...payload}
    default: 
      return newState
  }
}



//SAGA
const sagaMiddleware = createSagaMiddleware()

function fetchApi(url) {
    return Promise.resolve(fetch(url)
      .then(res => res.json())
      .then(data => data.data)
)}

// function fetchApi(url) {
//   return new Promise((resolve, reject) => {
//     fetch(url)
//       .then(res => res.json())
//       .then(data => {
//         resolve(data.data)
//     })
//   })
// }

function* dataAsync(action) {
	yield delay(500)
  const state = yield select()
  if(state.employee) {
    const data = yield call(fetchApi, action.payload.url)
    // const data = yield fetchApi(action.payload.url)
    yield put({type: "UPDATE_DATA_ASYNC", payload: {data, showDetails: true}})
  }
}

function* departmentHrAsync(action) {
  const state = yield select()
	yield put({type: "UPDATE_DEPARTMENT_ASYNC", payload: {list: state.hrs, employee: state.hrs[0]}})
}

function* departmentEngineersAsync(action) {
  const state = yield select()
 	yield put({type: "UPDATE_DEPARTMENT_ASYNC", payload: {list: state.engineers, employee: state.engineers[0]}})
}

// function* watchSomething() {
// 	yield takeLatest("UPDATE_DATA", dataAsync)
// 	yield takeEvery("UPDATE_DEPARTMENT_HR", departmentHrAsync)
// 	yield takeEvery("UPDATE_DEPARTMENT_ENGINEERS", departmentEngineersAsync)
// }

function* watchSomething() {
  yield all([
    takeLatest("UPDATE_DATA", dataAsync),
    takeEvery("UPDATE_DEPARTMENT_HR", departmentHrAsync),
    takeEvery("UPDATE_DEPARTMENT_ENGINEERS", departmentEngineersAsync)
  ])
}





//MIDDLEWARE
const middleware = [sagaMiddleware]



//STORE
const store = createStore(reducer, applyMiddleware(...middleware))
sagaMiddleware.run(watchSomething)



//APP
class App extends Component {
  render() {
    const list = this.props.list && this.props.list.map(id => {
      return <option key={id} value={id}>{id}</option>
    })

    const departments = this.props.departments && this.props.departments.map(dept => {
      return <option key={dept} value={dept}>{dept}</option>
    })

    const details = <>
      <img src={this.props.data && this.props.data.avatar}/>
      <div><strong>ID: </strong>{this.props.data && this.props.data.id}</div>
      <div>{this.props.data && this.props.data.first_name + " "}{this.props.data && this.props.data.last_name}</div>
    </>

    return (
      <Provider store={store}>
        <div className="Input">
          <div>
            <select onChange={this.props.handleDepartmentChange}>
              {departments}
            </select>
          </div>
          <div>
            <select onChange={this.props.handleEmployeeIdChange}>
              {list}
            </select>
          </div>

          <div>
              <button onClick={() => this.props.handleShowDetails(`https://reqres.in/api/users/${this.props.employee}`)}>Show Details</button>
          </div>
          <div>
              <button onClick={this.props.handleClear}>Clear</button>
          </div>
        </div>

        <div className="Output">
          {this.props.showDetails && details}
        </div>
      </Provider>
    )
  }

  componentDidMount() {
    this.props.adjustUI(this.props.departments[0], this.props.list[0])
  }
}



//ACTION CREATORS
const adjustUI = (department, employee) => {
  return {type: "UPDATE_DEPARTMENT_AND_EMPLOYEE", payload: {department, employee}}
}

const handleDepartmentChange = (e) => {
    const value = e.target.value
    if(value === "HR") {
        return {type: "UPDATE_DEPARTMENT_HR", payload: {department: value}}
    } else {
        return {type: "UPDATE_DEPARTMENT_ENGINEERS", payload: {department: value}}
    }
}

const handleEmployeeIdChange = (e) => {
  const value = e.target.value
  return {type: "UPDATE_EMPLOYEE", payload: {employee: value}}
}

const handleClear = () => {
  return {type: "CLEAR", payload: {hrs: null, engineers: null, list: null, departments: null, department: null, employee: null, showDetails: false}}
}

const handleShowDetails = (url) => {
    return {type: "UPDATE_DATA", payload: {url}}
}



//MAP STATE TO PROPS
const mapStateToProps = (state) => ({
  department: state.department,
  employee: state.employee,
  departments: state.departments,
  hrs: state.hrs,
  engineers: state.engineers,
  list: state.list,
  data: state.data,
  showDetails: state.showDetails
})



//MAP DISPATCH TO PROPS
const mapDispatchToProps = {
  handleDepartmentChange: handleDepartmentChange,
  handleEmployeeIdChange: handleEmployeeIdChange,
  handleShowDetails: (url) => handleShowDetails(url),
  handleClear: handleClear,
  adjustUI: adjustUI
}



//CONNECT
const ConnectedApp = connect(mapStateToProps, mapDispatchToProps)(App)
const reduxApp = (
  <Provider store={store}>
    <ConnectedApp/>
  </Provider>
)
render(reduxApp, document.getElementById('root'));
