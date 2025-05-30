if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('service-worker.js')
        .then(reg => console.log('Service Worker registered', reg))
        .catch(err => console.error('SW registration failed:', err));
    });
  }
  
  document.addEventListener('DOMContentLoaded', () => {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        event_type: 'view',
        payload: {
          url: window.location.href,
          title: document.title
        },
        user_id: getUserId()
      });
    }
  });
  
  document.getElementById('click-me').addEventListener('click', () => {
    navigator.serviceWorker.controller?.postMessage({
      event_type: 'click',
      payload: {
        element_id: 'click-me',
        text: 'Click Me',
        xpath: '/html/body/button[1]'
      },
      user_id: getUserId()
    });
  });
  
  document.getElementById('get-location').addEventListener('click', () => {
    navigator.geolocation.getCurrentPosition(position => {
      navigator.serviceWorker.controller?.postMessage({
        event_type: 'location',
        payload: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        },
        user_id: getUserId()
      });
    }, err => console.error('Location error:', err));
  });
  
  function getUserId() {
    let id = localStorage.getItem('user_id');
    if (!id) {
      id = 'user_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('user_id', id);
    }
    return id;
  }
  