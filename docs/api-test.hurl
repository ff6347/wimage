# API Test Suite for Wimage
# This file tests the complete workflow: Moondream analysis -> JSON extraction -> Wikipedia check

### Test 1: Extract JSON from Moondream Result
# This endpoint takes the raw text result from Moondream and uses OpenAI to extract structured JSON
POST http://localhost:4321/api/extract-json
Content-Type: application/json

{
  "result": "The image contains three interesting items: a laptop computer, a coffee mug, and a notebook."
}

HTTP 200
[Asserts]
jsonpath "$.success" == true
jsonpath "$.data" exists

[Captures]
extracted_data: jsonpath "$.data"


### Test 2: Check Wikipedia for extracted items
# This endpoint takes an array of terms and checks if Wikipedia articles exist
POST http://localhost:4321/api/check-wikipedia
Content-Type: application/json

{
  "items": ["laptop computer", "coffee mug", "notebook"]
}

HTTP 200
[Asserts]
jsonpath "$.success" == true
jsonpath "$.results" isCollection
jsonpath "$.results" count == 3


### Test 3: Extract JSON with array format
POST http://localhost:4321/api/extract-json
Content-Type: application/json

{
  "result": "[\"red apple\", \"wooden table\", \"glass window\"]"
}

HTTP 200
[Asserts]
jsonpath "$.success" == true
jsonpath "$.data" exists


### Test 4: Check Wikipedia with technical terms
POST http://localhost:4321/api/check-wikipedia
Content-Type: application/json

{
  "items": ["JavaScript", "Python programming", "Machine Learning"]
}

HTTP 200
[Asserts]
jsonpath "$.success" == true
jsonpath "$.results[0].exists" == true
jsonpath "$.results[0].url" exists


### Test 5: Error handling - empty items array
POST http://localhost:4321/api/check-wikipedia
Content-Type: application/json

{
  "items": []
}

HTTP 400
[Asserts]
jsonpath "$.error" exists


### Test 6: Error handling - no result provided
POST http://localhost:4321/api/extract-json
Content-Type: application/json

{
  "result": ""
}

HTTP 400
[Asserts]
jsonpath "$.error" == "No valid result provided"


### Test 7: Fetch Wikipedia article text
POST http://localhost:4321/api/fetch-wikipedia-text
Content-Type: application/json

{
  "urls": [
    "https://en.wikipedia.org/wiki/JavaScript",
    "https://en.wikipedia.org/wiki/Python_(programming_language)"
  ]
}

HTTP 200
[Asserts]
jsonpath "$.success" == true
jsonpath "$.results" isCollection
jsonpath "$.results" count == 2
jsonpath "$.results[0].title" exists
jsonpath "$.results[0].text" exists
jsonpath "$.results[0].preview" exists


### Test 8: Fetch Wikipedia text with invalid URL
POST http://localhost:4321/api/fetch-wikipedia-text
Content-Type: application/json

{
  "urls": [
    "https://en.wikipedia.org/invalid-url-format"
  ]
}

HTTP 200
[Asserts]
jsonpath "$.success" == true
jsonpath "$.results[0].error" exists


### Test 9: Error handling - no URLs provided
POST http://localhost:4321/api/fetch-wikipedia-text
Content-Type: application/json

{
  "urls": []
}

HTTP 400
[Asserts]
jsonpath "$.error" == "No valid URLs provided"


### Test 10: Summarize Wikipedia articles
POST http://localhost:4321/api/summarize-text
Content-Type: application/json

{
  "articles": [
    {
      "title": "JavaScript",
      "text": "JavaScript is a high-level, often just-in-time compiled language that conforms to the ECMAScript standard. It has dynamic typing, prototype-based object-orientation, and first-class functions. It is multi-paradigm, supporting event-driven, functional, and imperative programming styles."
    },
    {
      "title": "Python",
      "text": "Python is an interpreted, high-level, general-purpose programming language. Created by Guido van Rossum and first released in 1991, Python's design philosophy emphasizes code readability with its notable use of significant whitespace."
    }
  ]
}

HTTP 200
[Asserts]
jsonpath "$.success" == true
jsonpath "$.results" isCollection
jsonpath "$.results" count == 2
jsonpath "$.results[0].title" == "JavaScript"
jsonpath "$.results[0].summary" exists
jsonpath "$.results[1].title" == "Python"
jsonpath "$.results[1].summary" exists


### Test 11: Summarize with missing text
POST http://localhost:4321/api/summarize-text
Content-Type: application/json

{
  "articles": [
    {
      "title": "Test Article",
      "text": ""
    }
  ]
}

HTTP 200
[Asserts]
jsonpath "$.success" == true
jsonpath "$.results[0].error" exists


### Test 12: Error handling - no articles provided
POST http://localhost:4321/api/summarize-text
Content-Type: application/json

{
  "articles": []
}

HTTP 400
[Asserts]
jsonpath "$.error" == "No valid articles provided"
