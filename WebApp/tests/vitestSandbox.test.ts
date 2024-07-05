import { describe, expect, test, vi, beforeEach } from 'vitest'


// const cart = {
//   getApples: () => 42,
// }

// describe("Sandbox", ()=>{

//     test("how does fn work", ()=>{
//         const mockery = vi.fn(cart.getApples).mockImplementation(()=>1)

//         //Does the created object contain changes? Yes
//         expect(mockery()).toBe(1)

//         //Is the original method changed? No
//         expect(cart.getApples()).toBe(42)

//         //Do mock functions affect the mock? Yes
//         mockery.mockReturnValueOnce(15)
//         expect(mockery()).toBe(15)

//         //Do mock functions affect the original obj? No
//         mockery.mockReturnValueOnce(27)
//         // expect(cart.getApples()).toBe(27) -- Fails

//     })
//     test("how does spyOn work", ()=>{
//         const spy = vi.spyOn(cart, 'getApples').mockImplementation(() => 1)

//         //Does the created object contain changes? MockInstance is not callable
//         // expect(spy).toBe(1) -- Fails

//         //But it seems that we can change the behavior of the original obj through the spy:
//         spy.mockReturnValueOnce(17)
//         expect(cart.getApples()).toBe(17) //Passes
//     })
// })

//Q: Does MockImplementation last between tests/contexts/describes, or is the function reset once the test is over?

const mockedFunction = vi.fn()
describe('how long do mocks last', ()=>{

    test('setting the mock fn', ()=>{
        mockedFunction.mockImplementation(()=>5)
    })
    test('executing mocked fn from the last test', ()=>{
        expect(mockedFunction()).toBe(5)
    })
})

describe('does it last between describes?', ()=>{
    test('running the mock', ()=>{
        expect(mockedFunction()).toBe(5)
    })
})


//Q: how does beforeEach work? If defined outside any describe block, will it affect all test across all describes?

const anotherMockFn = vi.fn(()=>7)


describe('desc1', ()=>{

    beforeEach(()=>{
        anotherMockFn.mockRestore()
        console.log("AWOOOOOOGA")
    })
    test('t1', ()=>{
        expect(anotherMockFn()).toBe(7)
        //set the global mock to something else
        anotherMockFn.mockImplementation(()=>107)
    })
    test('t2', ()=>{
        expect(anotherMockFn()).toBe(7)
    })
})

// describe('desc2', ()=>{
//     test('t1', ()=>{
//         expect(anotherMockFn()).toBe(7)
//     })
// })












