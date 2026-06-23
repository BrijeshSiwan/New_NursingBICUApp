import axios from 'axios';


export const GetRequest = function (URL, callback) {

  axios({
    method: 'GET',
    url: URL,
    headers: {
      'Accept': 'application/json',
    
    },
    // data: ''
  }).then(response => {
    callback(response.data);
  }).catch(err => {
    callback(err);
  })
}

export const GetRequestwithauttoken = function (URL, auth_token, callback) {
  console.log(URL, auth_token)

  axios({
    method: 'GET',
    url: URL,
    headers: {
      'Accept': 'application/json',
      // "Authorization": () => getToken(),
      'Authorization': auth_token,
    },
  }).then(response => {
    callback(response.data);
  }).catch(err => {
    callback(err);
  })
}


export const GetRequestwithauttoken2 = function (URL, auth_token, callback) {
  console.log("gggjhgg",URL, auth_token)

  axios({
    method: 'GET',
    url: URL,
    headers: {
      'Accept': 'application/json',
      // "Authorization": () => getToken(),
      'Authorization': auth_token,
    },
  }).then(response => {
    callback(response.data);
  }).catch(err => {
    callback(err);
  })
}

export const GetRequestWithParams1 = function (URL, auth_token, callback) {
  console.log('GetRequestWithParams1', URL,)

  axios({
    method: 'GET',
    url: URL,
    headers: {
      'Accept': 'application/json',
      // "Authorization": () => getToken(),
      'Authorization': auth_token,
      // 'Content-Type': 'application/json',
    },
    // data: data === undefined || data === '' ? "" : data
  }).then(response => {
    callback(response.data);
  }).catch(err => {
    console.log(err);
  })
}

export const GetRequestWithParams2 = (URL, id, auth_token, callback) => {
  const x = id?.toString()
  console.log('GetRequestWithParams2', URL, x);

  const DATA = {
    parent_id: x,
  }
  axios({
    method: 'GET',
    url: URL,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      "Authorization": auth_token,
      // 'Authorization': 'eyJhbGciOiJIUzUxMiIsImlhdCI6MTY0MzUzOTY4MiwiZXhwIjoxNzI5ODQ5NjgyLjB9.eyJpZCI6IjRhMmQ2ZjUzLWM5ZDktNDFkNS04ZmRjLTAwZTViY2I2ZjhhOCJ9.KKZ2QSqUEqYGqyAuqp28hwtWPDQPQZsGIoL6JXuz_-L-li1kJnsletsv47hq7j24WJCiL_DBME-Zyj5vCMewxg',
    },
    params: DATA

  }).then(response => {
    callback(response.data);
  }).catch(err => {
    console.log(err);
  })
}


export const PutRequest = (URL, DATA, auth_token, callback) => {
  // debugger
  console.log(URL, DATA, auth_token,)
  axios({
    method: 'PUT',
    url: URL,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      "Authorization": auth_token,
    },
    data: DATA

  }).then(response => {
    // debugger
    callback(response.data);
  }).catch(err => {
    callback(err);
  })
}

export const GetCommentRequest = function (URL, auth_token, params, callback) {
  console.log(URL, auth_token, params)


  axios({
    method: 'GET',
    url: URL,
    headers: {
      // 'Accept': 'application/json',
      // "Authorization": () => getToken(),
      'Authorization': auth_token,
      'Content-Type': 'application/json',
    },
  }).then(response => {
    // debugger
    callback(response.data);
  }).catch(err => {
    console.log(err);
  })
}

export const PostCommentRequest = function (URL, auth_token, params, callback) {
  console.log(URL, auth_token, params)
  axios({
    url: URL,
    method: 'POST',
    data: params,
    headers: {
     // Accept: 'application/json',
      'Authorization': auth_token,
      'Content-Type': 'application/json',
    },
  }).then(response => {
    // debugger
    callback(response.data);
  }).catch(err => {
    callback(err);
  })
}


export const PostRequestwithParams = (URL, data, callback) => {
  console.log(URL, data, )
  const DATA = data;
  axios({
    method: 'POST',
    url: URL,
    headers: {
      'Accept': 'application/json',
 
      'Content-Type': 'application/json',
    },
    data: DATA
  }).then(response => {
    callback(response.data);
  }).catch(err => {
    callback(err);
  })
}

export const PostRequest = function (URL, callback) {

  axios({
    method: 'POST',
    url: URL,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  }).then(response => {
    callback(response.data);
  }).catch(err => {
    callback(err);
  })
}

