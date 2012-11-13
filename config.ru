require 'rubygems'
require 'sinatra'
require 'mongo'
require 'json'
require 'haml'

require './app'

Bundler.require

run Sinatra::Application