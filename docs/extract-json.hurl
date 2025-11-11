# Extract JSON API Tests
# Tests the /api/extract-json endpoint that uses OpenAI to extract structured JSON from Moondream results

### Test 1: Extract JSON from natural language description
POST http://localhost:4321/api/extract-json
Content-Type: application/json

{
  "result": "The image contains three interesting items: a laptop computer, a coffee mug, and a notebook."
}

HTTP 200
[Asserts]
jsonpath "$.success" == true
jsonpath "$.data" exists
jsonpath "$.rawResult" exists


### Test 2: Extract JSON from array format
POST http://localhost:4321/api/extract-json
Content-Type: application/json

{
  "result": "[\"red apple\", \"wooden table\", \"glass window\"]"
}

HTTP 200
[Asserts]
jsonpath "$.success" == true
jsonpath "$.data" exists


### Test 3: Extract JSON from markdown code block
POST http://localhost:4321/api/extract-json
Content-Type: application/json

{
  "result": "```json\n[\"mountain\", \"lake\", \"forest\"]\n```"
}

HTTP 200
[Asserts]
jsonpath "$.success" == true
jsonpath "$.data" exists


### Test 4: Error - empty result
POST http://localhost:4321/api/extract-json
Content-Type: application/json

{
  "result": ""
}

HTTP 400
[Asserts]
jsonpath "$.error" == "No valid result provided"


### Test 5: Error - missing result field
POST http://localhost:4321/api/extract-json
Content-Type: application/json

{}

HTTP 400
[Asserts]
jsonpath "$.error" == "No valid result provided"


### Test 6: Error - non-string result
POST http://localhost:4321/api/extract-json
Content-Type: application/json

{
  "result": 123
}

HTTP 400
[Asserts]
jsonpath "$.error" == "No valid result provided"
