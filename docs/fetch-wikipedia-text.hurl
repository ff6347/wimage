# Fetch Wikipedia Text API Tests
# Tests the /api/fetch-wikipedia-text endpoint that retrieves full article text from Wikipedia

### Test 1: Fetch single article
POST http://localhost:4321/api/fetch-wikipedia-text
Content-Type: application/json

{
  "urls": ["https://en.wikipedia.org/wiki/JavaScript"]
}

HTTP 200
[Asserts]
jsonpath "$.success" == true
jsonpath "$.results" isCollection
jsonpath "$.results" count == 1
jsonpath "$.results[0].url" == "https://en.wikipedia.org/wiki/JavaScript"
jsonpath "$.results[0].title" == "JavaScript"
jsonpath "$.results[0].text" exists
jsonpath "$.results[0].preview" exists


### Test 2: Fetch multiple articles
POST http://localhost:4321/api/fetch-wikipedia-text
Content-Type: application/json

{
  "urls": [
    "https://en.wikipedia.org/wiki/JavaScript",
    "https://en.wikipedia.org/wiki/Python_(programming_language)",
    "https://en.wikipedia.org/wiki/Rust_(programming_language)"
  ]
}

HTTP 200
[Asserts]
jsonpath "$.success" == true
jsonpath "$.results" count == 3
jsonpath "$.results[0].title" exists
jsonpath "$.results[0].text" exists
jsonpath "$.results[1].title" exists
jsonpath "$.results[1].text" exists
jsonpath "$.results[2].title" exists
jsonpath "$.results[2].text" exists


### Test 3: Fetch article with special characters in URL
POST http://localhost:4321/api/fetch-wikipedia-text
Content-Type: application/json

{
  "urls": ["https://en.wikipedia.org/wiki/Python_(programming_language)"]
}

HTTP 200
[Asserts]
jsonpath "$.success" == true
jsonpath "$.results[0].title" == "Python (programming language)"
jsonpath "$.results[0].text" exists


### Test 4: Invalid URL format (not a wiki URL)
POST http://localhost:4321/api/fetch-wikipedia-text
Content-Type: application/json

{
  "urls": ["https://en.wikipedia.org/invalid-url-format"]
}

HTTP 200
[Asserts]
jsonpath "$.success" == true
jsonpath "$.results[0].error" exists


### Test 5: Invalid URL format (not starting with /wiki/)
POST http://localhost:4321/api/fetch-wikipedia-text
Content-Type: application/json

{
  "urls": ["https://en.wikipedia.org/help/something"]
}

HTTP 200
[Asserts]
jsonpath "$.success" == true
jsonpath "$.results[0].error" == "Invalid Wikipedia URL format"


### Test 6: Mixed valid and invalid URLs
POST http://localhost:4321/api/fetch-wikipedia-text
Content-Type: application/json

{
  "urls": [
    "https://en.wikipedia.org/wiki/JavaScript",
    "https://en.wikipedia.org/invalid-format"
  ]
}

HTTP 200
[Asserts]
jsonpath "$.success" == true
jsonpath "$.results" count == 2
jsonpath "$.results[0].text" exists
jsonpath "$.results[1].error" exists


### Test 7: Error - empty URLs array
POST http://localhost:4321/api/fetch-wikipedia-text
Content-Type: application/json

{
  "urls": []
}

HTTP 400
[Asserts]
jsonpath "$.error" == "No valid URLs provided"


### Test 8: Error - missing URLs field
POST http://localhost:4321/api/fetch-wikipedia-text
Content-Type: application/json

{}

HTTP 400
[Asserts]
jsonpath "$.error" == "No valid URLs provided"


### Test 9: Error - non-array URLs
POST http://localhost:4321/api/fetch-wikipedia-text
Content-Type: application/json

{
  "urls": "not an array"
}

HTTP 400
[Asserts]
jsonpath "$.error" == "No valid URLs provided"
