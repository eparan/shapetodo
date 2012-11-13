require 'rubygems'
require 'sinatra'
require 'mongo'
require 'json'
require 'haml'
require 'uri'

# puts "Running on MongoHQ" 
# heroku config:add 


def get_connection
  return @db_connection if @db_connection
  if ENV['MONGOHQ_URL']
    db = URI.parse(ENV['MONGOHQ_URL'])
    db_name = db.path.gsub(/^\//, '')
    @db_connection = Mongo::Connection.new(db.host, db.port).db(db_name)
    @db_connection.authenticate(db.user, db.password) unless (db.user.nil? || db.user.nil?)
  else
    @db_connection = Mongo::Connection.new.db("localhost")
  end
  @db_connection
end

DB = get_connection

get '/' do
  haml :memo, :attr_wrapper => '"', :locals => {:title => 'ShapeTodo'}
end

get '/api/:thing' do
  # query a collection :thing, convert the output to an array, map the _id
  # to a string representation of the object's _id and finally output to JSON.
  content_type 'application/json', :charset => 'utf-8'
  DB.collection(params[:thing]).find.to_a.map{|t| from_bson_id(t)}.to_json
end

get '/api/:thing/:id' do
  content_type 'application/json', :charset => 'utf-8'
  from_bson_id(DB.collection(params[:thing]).find_one(to_bson_id(params[:id]))).to_json
end

post '/api/:thing' do
  content_type 'application/json', :charset => 'utf-8'
  oid = DB.collection(params[:thing]).insert(JSON.parse(request.body.read.to_s))
  "{\"_id\":\"#{oid.to_s}\"}"
end

delete '/api/:thing/:id' do
  content_type 'application/json', :charset => 'utf-8'
  DB.collection(params[:thing]).remove('_id' => to_bson_id(params[:id])) unless params[:id].to_s == '50a1d830e998870002000001'
end

put '/api/:thing/:id' do
  content_type 'application/json', :charset => 'utf-8'
  todo = request.body.read.to_s
  DB.collection(params[:thing]).update({'_id' => to_bson_id(params[:id])}, {'$set' => JSON.parse(todo).reject{|k,v| k == '_id'}}) unless params[:id].to_s == '50a1d830e998870002000001'
  todo
end

def to_bson_id(id) BSON::ObjectId.from_string(id) end
def from_bson_id(obj) obj.merge({'_id' => obj['_id'].to_s}) end

