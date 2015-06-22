function handleGetDeviceInfo(success, fail, service, action, args) {
    success({
        model: document.getElementById('device-model').value,
        platform: document.getElementById('device-platform').value,
        uuid: document.getElementById('device-uuid').value,
        version: document.getElementById('device-version').value
    });
}

function initialize() {
    var devices = [
        {
            'id': 'AcerA500',
            'name': 'Acer A500',
            'model': 'Picasso',
            'platform': 'Android',
            'version': '4.0',
            'uuid': '500'
        },
        {
            'id': 'Bold9700',
            'name': 'BlackBerry Bold 9700',
            'model': '9700',
            'platform': 'BlackBerry OS',
            'version': '6',
            'uuid': '42'
        },
        {
            'id': 'Bold9900',
            'name': 'BlackBerry Bold 9900',
            'model': '9900',
            'platform': 'BlackBerry OS',
            'version': '7',
            'uuid': '42'
        },
        {
            'id': 'Curve9300',
            'name': 'BlackBerry Curve 9300',
            'model': '9300',
            'platform': 'BlackBerry OS',
            'version': '6',
            'uuid': '42'
        },
        {
            'id': 'Curve9350-9360-9370',
            'name': 'BlackBerry Curve 9350/9360/9370',
            'model': '9350-9360-9370',
            'platform': 'BlackBerry OS',
            'version': '7',
            'uuid': '42'
        },
        {
            'id': 'FWVGA',
            'name': 'Generic - FWVGA (480x854)',
            'model': 'Generic',
            'platform': 'Generic',
            'version': 'Generic',
            'uuid': '42'
        },
        {
            'id': 'G1',
            'name': 'HTC G1',
            'model': 'G1',
            'platform': 'Android',
            'version': '1.6',
            'uuid': '6F196F23-FD0D-4F62-B27B-730147FCC5A3'
        },
        {'id': 'HPPre3', 'name': 'HP Pre 3', 'model': 'Pre', 'platform': 'WebOS', 'version': '2.x'},
        {'id': 'HPVeer', 'name': 'HP Veer', 'model': 'Veer', 'platform': 'WebOS', 'version': '2.x'},
        {
            'id': 'HVGA',
            'name': 'Generic - HVGA (320x480)',
            'model': 'Generic',
            'platform': 'Generic',
            'version': 'Generic',
            'uuid': '42'
        },
        {
            'id': 'iPad',
            'name': 'iPad',
            'model': 'iPad',
            'platform': 'iOS',
            'version': '1.6',
            'uuid': 'e0101010d38bde8e6740011221af335301010333'
        },
        {
            'id': 'iPad3',
            'name': 'iPad 3',
            'model': 'iPad3',
            'platform': 'iOS',
            'version': '5',
            'uuid': 'e0101010d38bde8e6740011221af335301010334'
        },
        {
            'id': 'iPhone3',
            'name': 'iPhone 3G/3Gs',
            'model': '3G',
            'platform': 'iPhone',
            'version': '3',
            'uuid': 'e0101010d38bde8e6740011221af335301010333'
        },
        {
            'id': 'iPhone4',
            'name': 'iPhone 4/4s',
            'model': '4s',
            'platform': 'iOS',
            'version': '5',
            'uuid': 'e0101010d38bde8e6740011221af335301010333'
        },
        {
            'id': 'iPhone5',
            'name': 'iPhone 5',
            'model': '5',
            'platform': 'iOS',
            'version': '6',
            'uuid': 'e0101010d38bde8e6740011221af335301010333'
        },
        {
            'id': 'Legend',
            'name': 'HTC Legend',
            'model': 'Legend',
            'platform': 'Android',
            'version': '1.6',
            'uuid': '6F196F23-FD0D-4F62-B27B-730147FCC5A3'
        },
        {
            'id': 'Nexus',
            'name': 'Nexus One',
            'model': 'Nexux One',
            'platform': 'Android',
            'version': '2.x.x',
            'uuid': '6F196F23-FD0D-4F62-B27B-730147FCC5A3'
        },
        {
            'id': 'Nexus4',
            'name': 'Nexus 4',
            'model': 'Nexus 4',
            'platform': 'Android',
            'version': '4.2.x',
            'uuid': 'DC46B660-EF6F-46D4-AC24-85CFAB0C7694'
        },
        {
            'id': 'Nexus7',
            'name': 'Nexus 7 (Tablet)',
            'model': 'Nexus 7 8/16 GB',
            'platform': 'Android',
            'version': '4.x.x',
            'uuid': '903802EA-1786-4175-B0F1-1FDF87813CAA'
        },
        {
            'id': 'NexusGalaxy',
            'name': 'Nexus (Galaxy)',
            'model': 'Galaxy Nexus (generic)',
            'platform': 'Android',
            'version': '4.x.x',
            'uuid': '3D0AD03B-8B46-431A-BEF5-FF01B96BA990'
        },
        {
            'id': 'NexusS',
            'name': 'Nexus S',
            'model': 'Nexux S',
            'platform': 'Android',
            'version': '2.3.x',
            'uuid': 'F54E13F1-C1B7-4212-BFA8-AB3C9C3F088F'
        },
        {'id': 'NokiaN8', 'name': 'Nokia N8', 'model': 'N8', 'platform': 'SymbianOS', 'version': '3', 'uuid': '42'},
        {
            'id': 'NokiaN97',
            'name': 'Nokia N97/5800 (touch)',
            'model': 'N97',
            'platform': 'S60',
            'version': 'v5',
            'uuid': '42'
        },
        {'id': 'PalmPre', 'name': 'Palm Pre', 'model': 'Pre', 'platform': 'WebOS', 'version': '1.x'},
        {'id': 'PalmPre2', 'name': 'Palm Pre 2', 'model': 'Pre', 'platform': 'WebOS', 'version': '2.x'},
        {
            'id': 'Pearl9100',
            'name': 'BlackBerry Pearl 9100',
            'model': '9100',
            'platform': 'BlackBerry OS',
            'version': '6',
            'uuid': '42'
        },
        {
            'id': 'Playbook',
            'name': 'BlackBerry Playbook',
            'model': '100669958',
            'platform': 'BlackBerry PlayBook OS',
            'version': 'BlackBerry PlayBook OS',
            'uuid': '42'
        },
        {
            'id': 'Q10',
            'name': 'BlackBerry Q10',
            'model': 'Q10',
            'platform': 'BlackBerry',
            'version': '10.1',
            'uuid': '42'
        },
        {
            'id': 'QVGA',
            'name': 'Generic - QVGA (240X320)',
            'model': 'Generic',
            'platform': 'Generic',
            'version': 'Generic',
            'uuid': '42'
        },
        {
            'id': 'Style9670',
            'name': 'BlackBerry Style 9670',
            'model': '9670',
            'platform': 'BlackBerry OS',
            'version': '6',
            'uuid': '42'
        },
        {
            'id': 'Tattoo',
            'name': 'HTC Tattoo',
            'model': 'Tattoo',
            'platform': 'Android',
            'version': '1.6',
            'uuid': '6F196F23-FD0D-4F62-B27B-730147FCC5A3'
        },
        {
            'id': 'Torch9800',
            'name': 'BlackBerry Torch 9800',
            'model': '9800',
            'platform': 'BlackBerry OS',
            'version': '6',
            'uuid': '42'
        },
        {
            'id': 'Torch9810',
            'name': 'BlackBerry Torch 9810',
            'model': '9810',
            'platform': 'BlackBerry OS',
            'version': '7',
            'uuid': '42'
        },
        {
            'id': 'Torch9860-9850',
            'name': 'BlackBerry Torch 9860/9850',
            'model': '9860-9850',
            'platform': 'BlackBerry OS',
            'version': '7',
            'uuid': '42'
        },
        {'id': 'Wave', 'name': 'Samsung Wave', 'model': 'Wave', 'platform': 'Bada', 'version': 'n/a'},
        {
            'id': 'WQVGA',
            'name': 'Generic - WQVGA (240x480)',
            'model': 'Generic',
            'platform': 'Generic',
            'version': 'Generic',
            'uuid': '42'
        },
        {
            'id': 'WVGA',
            'name': 'Generic - WVGA (480x800)',
            'model': 'Generic',
            'platform': 'Generic',
            'version': 'Generic',
            'uuid': '42'
        },
        {
            'id': 'Z10',
            'name': 'BlackBerry Z10',
            'model': 'Z10',
            'platform': 'BlackBerry',
            'version': '10.0.10',
            'uuid': '42'
        }
    ];

    devices.sort(function (left, right) {
        left = left.name.toUpperCase();
        right = right.name.toUpperCase();
        if (left < right) {
            return -1;
        }
        if (right < left) {
            return 1;
        }
        return 0;
    });

    var deviceList = document.getElementById('device-list');

    devices.forEach(function (device) {
        var option = document.createElement('option');
        option.value = device.id;

        var caption = document.createTextNode(device.name);
        option.appendChild(caption);

        option.setAttribute('_model', device.model);
        option.setAttribute('_platform', device.platform);
        option.setAttribute('_version', device.version);
        option.setAttribute('_uuid', device.uuid);

        deviceList.appendChild(option);
    });

    deviceList.value = 'WVGA';
    handleSelectDevice();
}

function handleSelectDevice() {
    console.log('handleSelectDevice()');

    var deviceList = document.getElementById('device-list');
    var option = deviceList.options[deviceList.selectedIndex];
    console.log('option');
    console.log(option);

    document.getElementById('device-model').value = option.getAttribute('_model');
    document.getElementById('device-platform').value = option.getAttribute('_platform');
    document.getElementById('device-uuid').value = option.getAttribute('_uuid');
    document.getElementById('device-version').value = option.getAttribute('_version');
}

cordova.registerPluginHandlers({'Device.getDeviceInfo': handleGetDeviceInfo});

module.exports = {
    initialize: initialize,
    handleSelectDevice: handleSelectDevice
};
