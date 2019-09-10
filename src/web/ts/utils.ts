export function greet (person: String) {
	console.log(`Greetings ${person}`)
}

export function reverseStr (str: string) {
	return str.split('').reverse().join('')
}

export function last<T> (a: Array<T>): T {
	return a[a.length - 1]
}
