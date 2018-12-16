class FeatureInterface {
  createInterface(param, ref, refKey) {
    var wrapper = document.createElement('div')
    wrapper.classList.add('feature-input')

    switch (param.type) {
      case 'number':
        var numberInput = document.createElement('input')
        numberInput.type = 'number'
        numberInput.name = param.name
        numberInput.placeholder = param.label
        numberInput.addEventListener('input', function() {
          ref[refKey] = +this.value
        })
        wrapper.appendChild(numberInput)

        break;

      case 'checkbox':
        var id = guid()

        var featureCheckbox = document.createElement('input')
        featureCheckbox.type = 'checkbox'
        featureCheckbox.id = 'enable-' + id
        featureCheckbox.checked = param.enabled
        featureCheckbox.addEventListener('change', function() {
          ref[refKey] = this.enabled
        })
        wrapper.appendChild(featureCheckbox)

        var featureLabel = document.createElement('label')
        featureLabel.htmlFor = 'enable-' + id
        featureLabel.classList.add('feature-label-small')
        featureLabel.innerHTML = param.label
        wrapper.appendChild(featureLabel)

        break;

      case 'range':
        var label = document.createElement('div')
        label.classList.add('feature-label')
        label.innerHTML = param.label
        wrapper.appendChild(label)

        var input = document.createElement('input')
        input.type = 'range'
        input.name = param.name
        input.min = param.min
        input.max = param.max
        input.step = param.step
        wrapper.appendChild(input)

        break;

      case 'magic':
        wrapper = false

        break;

      case 'object':
        ref[refKey] = {}

        for (var subParam of param.params) {
          ref[refKey][subParam.name] = false
          var subElem = this.createInterface(subParam, ref[refKey], [
            subParam.name
          ])
          if (subElem) {
            wrapper.appendChild(subElem)
          }
        }

        break;

      default:
        var textField = document.createElement('input')
        textField.type = 'text'
        textField.name = param.name
        textField.placeholder = param.label
        wrapper.appendChild(textField)
        break;
    }

    return wrapper
  }

  constructor(data) {
    this.name = data.name
    this.value = false
    this.elem = this.createInterface(data, this, 'value')
  }
}

class Feature {
  createInterfaceForParameter(param) {

    return {
      element: elem,
      raw: param,
    }
  }

  constructor(data) {
    var that = this;
    this.id = guid();
    this.params = []
    this.enabled = false
    this.name = data.name

    this.tree = document.createElement('div')
    this.tree.classList.add('feature')
    this.tree.dataset.settingsFeature = this.id

    if (data.required) {
      var featureLabel = document.createElement('div')
      featureLabel.classList.add('feature-label')
      featureLabel.innerHTML = data.label
      this.tree.appendChild(featureLabel)
    } else {
      var featureCheckbox = document.createElement('input')
      featureCheckbox.type = 'checkbox'
      featureCheckbox.id = 'enable-' + this.id
      featureCheckbox.checked = this.enabled
      featureCheckbox.addEventListener('change', function() {
        that.enabled = !that.enabled
      })
      this.tree.appendChild(featureCheckbox)

      var featureLabel = document.createElement('label')
      featureLabel.htmlFor = 'enable-' + this.id
      featureLabel.classList.add('feature-label')
      featureLabel.innerHTML = data.label
      this.tree.appendChild(featureLabel)
    }

    var featureDescription = document.createElement('div')
    featureDescription.classList.add('feature-description')
    featureDescription.innerHTML = data.description
    this.tree.appendChild(featureDescription)

    for (var param of data.params) {
      var inter = new FeatureInterface(param)
      this.params.push(inter)
      if (inter.elem) {
        this.tree.appendChild(inter.elem)
      }
    }
  }

  render() {
    return this.tree
  }
}

class Settings {
  constructor(initialData) {
    this.id = guid()
    this.initialData = initialData
    this.tree = document.createElement('div')
    this.tree.classList.add('settings-group')
    this.tree.dataset.settingsGroup = this.id
    this.features = []

    for (var chainElement of this.initialData) {
      var f = this.createFeature(chainElement)
      this.features.push(f)
      this.tree.appendChild(f.render())
    }

    console.log(this.tree)
  }

  createFeature(data) {
    return new Feature(data)
  }
}

var imageSettings = new Settings([{
    name: 'resize',
    label: 'Resize',
    description: 'Resize the image to a specified size. More options for the behaviour can be found below',
    params: [{
      type: 'number',
      name: 'width',
      label: 'width'
    }, {
      type: 'number',
      name: 'height',
      label: 'height'
    }],
  },
  {
    name: 'jpeg',
    label: 'JPEG processing settings',
    description: 'Options for jpg files',
    required: true,
    params: [{
      type: 'object',
      name: 'options',
      label: 'Options',
      params: [{
        type: 'range',
        name: 'quality',
        label: 'Quality',
        from: 0,
        to: 100,
        step: 1,
      }, {
        type: 'checkbox',
        name: 'progressive',
        label: 'Progressive scanning'
      }, {
        type: 'magic',
        name: 'force',
        value: true
      }]
    }]
  },
  {
    name: 'png',
    label: 'PNG processing settings',
    description: 'Options for png files',
    required: true,
    params: [{
      type: 'object',
      name: 'options',
      label: 'Options',
      params: [{
        type: 'range',
        name: 'compressionLevel',
        label: 'Compression level',
        from: 0,
        to: 9,
        step: 1,
      }, {
        type: 'checkbox',
        name: 'progressive',
        label: 'Progressive scanning'
      }, {
        type: 'checkbox',
        name: 'adaptiveFiltering',
        label: 'Adaptive filtering'
      }, {
        type: 'magic',
        name: 'force',
        value: true
      }]
    }]
  },
  {
    name: 'max',
    label: 'Crop to exact size',
    description: 'This will crop the image after resizing to exactly fit the specified size. So some content on the edge of the image will be lost.',
    params: [],
    reverse: true
  },
  {
    name: 'withoutEnlargement',
    label: 'Upscale to fit size',
    description: 'Scale the image larger if it\'s smaller than the specified size. This can easily result in a blurry image.',
    params: []
  }
])

console.log(imageSettings)