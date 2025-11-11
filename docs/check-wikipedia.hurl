# Check Wikipedia API Tests
# Tests the /api/check-wikipedia endpoint that checks if Wikipedia articles exist for given terms

### Test 1: Check technical terms (should exist)
POST http://localhost:4321/api/check-wikipedia
Content-Type: application/json

{
  "items": ["JavaScript", "Python programming", "Machine Learning"]
}

HTTP 200
[Asserts]
jsonpath "$.success" == true
jsonpath "$.results" isCollection
jsonpath "$.results" count == 3
jsonpath "$.results[0].term" == "JavaScript"
jsonpath "$.results[0].exists" == true
jsonpath "$.results[0].url" exists
jsonpath "$.results[0].pageId" exists


### Test 2: Check common objects
POST http://localhost:4321/api/check-wikipedia
Content-Type: application/json

{
  "items": ["laptop computer", "coffee mug", "notebook"]
}

HTTP 200
[Asserts]
jsonpath "$.success" == true
jsonpath "$.results" count == 3


### Test 3: Check non-existent terms
POST http://localhost:4321/api/check-wikipedia
Content-Type: application/json

{
  "items": ["xyzabc123nonexistent", "faketerm999"]
}

HTTP 200
[Asserts]
jsonpath "$.success" == true
jsonpath "$.results" count == 2
jsonpath "$.results[0].exists" == false
jsonpath "$.results[1].exists" == false


### Test 4: Check mixed (some exist, some don't)
POST http://localhost:4321/api/check-wikipedia
Content-Type: application/json

{
  "items": ["JavaScript", "xyznonexistent123"]
}

HTTP 200
[Asserts]
jsonpath "$.success" == true
jsonpath "$.results" count == 2
jsonpath "$.results[0].exists" == true
jsonpath "$.results[1].exists" == false


### Test 5: Error - empty items array
POST http://localhost:4321/api/check-wikipedia
Content-Type: application/json

{
  "items": []
}

HTTP 400
[Asserts]
jsonpath "$.error" == "No valid items provided"


### Test 6: Error - missing items field
POST http://localhost:4321/api/check-wikipedia
Content-Type: application/json

{}

HTTP 400
[Asserts]
jsonpath "$.error" == "No valid items provided"


### Test 7: Error - non-array items
POST http://localhost:4321/api/check-wikipedia
Content-Type: application/json

{
  "items": "not an array"
}

HTTP 400
[Asserts]
jsonpath "$.error" == "No valid items provided"
