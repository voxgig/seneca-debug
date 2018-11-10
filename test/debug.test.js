/* Copyright (c) 2018 voxgig and other contributors, MIT License */
'use strict'

const Util = require('util')

const Lab = require('lab')
const Code = require('code')
const lab = (exports.lab = Lab.script())
const expect = Code.expect

const PluginValidator = require('seneca-plugin-validator')
const Seneca = require('seneca')
const Optioner = require('optioner')
const Joi = Optioner.Joi

const Plugin = require('..')


lab.test('validate', Util.promisify(function(x,fin){PluginValidator(Plugin, module)(fin)}))


lab.test('happy', async () => {
  var si = seneca_instance()
})



function seneca_instance(fin, testmode) {
  return Seneca()
    .test(fin, testmode)
    .use(Plugin)
    .use('seneca-joi')
    .use('entity')
}
