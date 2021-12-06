json = importModule('index').json

describe 'JSON', ->
	describe '#purify', ->
		Given -> @addStack = true
		When -> @result = json.purify(@data, @addStack)

		describe 'plain object', ->
			Given -> @data = {a:'a'}
			Then -> 
				@result.should.not.be.undefined
				@result.should.eql(@data)

		describe 'plain string', ->
			Given -> @data = 'some data'
			Then -> 
				@result.should.not.be.undefined
				@result.should.eql(@data)

		describe 'plain array', ->
			Given -> @data = [1,2,3]
			Then -> 
				@result.should.not.be.undefined
				@result.should.eql(@data)

		describe 'object has toJSON method', ->
			describe 'no error is thrown', ->
				Given -> @data = {one:{toJSON: -> {two: 'three'}}}
				Then ->
					@result.should.not.be.undefined
					@result.should.eql({one:{two:'three'}})
			describe 'error is thrown', ->
				Given ->
					@errorMessage = 'something bad happened'
					@data = {one:{toJSON: => throw new Error(@errorMessage)}}
				Then ->
					@result.should.not.be.undefined
					@result.one.should.be.an('object')
					@result.one.errorType.should.equal('Error')
					@result.one.message.should.equal(@errorMessage)
					@result.one.stack.should.be.an('Array')

		describe 'object is an error', ->
			Given -> 
				@errorMessage = 'something bad happened'
				@data = new Error(@errorMessage)

			describe 'with stack', ->
				Then ->
					@result.should.not.be.undefined
					@result.errorType.should.equal('Error')
					@result.message.should.equal(@errorMessage)
					@result.stack.should.be.an('Array')
			
			describe 'without stack', ->
				Given -> @addStack = false
				Then ->
					@result.should.not.be.undefined
					@result.errorType.should.equal('Error')
					@result.message.should.equal(@errorMessage)
					expect(@result.stack).to.be.undefined

		describe 'object has a circular reference', ->
			Given ->
				@data = {two:{three:'three'}}
				@data.two.one = @data
			Then ->
				@result.should.not.be.undefined
				@result.two.should.be.an('object')
				@result.two.three.should.equal('three')
				@result.two.one.should.equal('[Circular]')

		describe 'object has a getter that throws an error', ->
			Given ->
				@data = `{
					get one() { throw new Error('something bad happened')}
				}`
			Then ->
				@result.should.not.be.undefined
				@result.should.be.an('object')
				@result.one.errorType.should.equal('Error')
				@result.one.message.should.equal('something bad happened')
				@result.one.stack.should.be.an('Array')

	describe '#stringify', ->
		Given -> @data = {one:'one'}
		When -> @result = json.stringify(@data, @format)

		describe 'with format', ->
			Given -> @format = false
			Then -> 
				@result.should.be.a('string')
				@result.should.equal(JSON.stringify(@data))

		describe 'without format', ->
			Given -> @format = true
			Then -> 
				@result.should.be.a('string')
				@result.should.equal(JSON.stringify(@data, null,2))

	describe '#replacer', ->
		Given -> 
			@data = {one:{value:1}}
			@data.two = @data.one
		When -> @result = JSON.stringify(@data, json.getReplacer())
		Then ->
			@result.should.be.a('string')
			@result.should.equal('{"one":{"value":1},"two":"[Circular]"}')
